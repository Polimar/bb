import Redis from 'ioredis';

interface GameMessage {
  type: string;
  gameId: string;
  timestamp: number;
  data: any;
}

interface QuestionMessage extends GameMessage {
  type: 'NEW_QUESTION';
  data: {
    questionId: string;
    questionNumber: number;
    text: string;
    options: string[];
    timeLimit: number;
  };
}

interface AnswerMessage extends GameMessage {
  type: 'ANSWER_SUBMITTED';
  data: {
    playerId: string;
    questionId: string;
    answer: number;
    responseTime: number;
  };
}

interface HeartbeatMessage extends GameMessage {
  type: 'HOST_HEARTBEAT';
  data: {
    hostId: string;
  };
}

/**
 * Redis Streams coordinator for P2P game messaging
 * Handles signaling and coordination between mobile devices
 */
export class GameCoordinator {
  private redis: Redis;
  private gameId: string;
  private isListening: boolean = false;
  private messageHandlers: Map<string, Function[]> = new Map();
  
  constructor(gameId: string, redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.gameId = gameId;
    this.setupErrorHandling();
  }
  
  private setupErrorHandling(): void {
    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    this.redis.on('connect', () => {
      console.log('✅ Redis connected for game:', this.gameId);
    });
  }
  
  /**
   * Host announces new question to all players
   */
  async broadcastQuestion(question: any, timeLimit: number): Promise<void> {
    const message: QuestionMessage = {
      type: 'NEW_QUESTION',
      gameId: this.gameId,
      timestamp: Date.now(),
      data: {
        questionId: question.id,
        questionNumber: question.number || 1,
        text: question.text,
        options: question.options,
        timeLimit
      }
    };
    
    await this.publishMessage('questions', message);
    console.log(`📤 Question broadcast: ${question.text.substring(0, 50)}...`);
  }
  
  /**
   * Client submits answer
   */
  async submitAnswer(playerId: string, questionId: string, answer: number, responseTime: number): Promise<void> {
    const message: AnswerMessage = {
      type: 'ANSWER_SUBMITTED',
      gameId: this.gameId,
      timestamp: Date.now(),
      data: {
        playerId,
        questionId,
        answer,
        responseTime
      }
    };
    
    await this.publishMessage('answers', message);
    console.log(`📥 Answer submitted by ${playerId}: ${answer} (${responseTime}ms)`);
  }
  
  /**
   * Host sends heartbeat to indicate it's alive
   */
  async sendHeartbeat(hostId: string): Promise<void> {
    const message: HeartbeatMessage = {
      type: 'HOST_HEARTBEAT',
      gameId: this.gameId,
      timestamp: Date.now(),
      data: {
        hostId
      }
    };
    
    await this.publishMessage('heartbeat', message);
  }
  
  /**
   * Monitor host heartbeat and detect disconnections
   */
  async monitorHostHeartbeat(hostId: string, onTimeout: () => void): Promise<void> {
    const stream = this.getStreamName('heartbeat');
    
    // Check last heartbeat
    const checkHeartbeat = async () => {
      try {
        const lastMessages = await this.redis.xrevrange(stream, '+', '-', 'COUNT', 1);
        
        if (lastMessages.length === 0) {
          console.log('⚠️ No heartbeat found - host may be disconnected');
          onTimeout();
          return;
        }
        
        const lastMessage = lastMessages[0];
        const messageData = this.parseStreamMessage(lastMessage);
        
        if (messageData.data.hostId !== hostId) {
          console.log('⚠️ Heartbeat from different host - election may have occurred');
          return;
        }
        
        const timeSinceLastHeartbeat = Date.now() - messageData.timestamp;
        const HEARTBEAT_TIMEOUT = 10000; // 10 seconds
        
        if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
          console.log(`💔 Host heartbeat timeout: ${timeSinceLastHeartbeat}ms > ${HEARTBEAT_TIMEOUT}ms`);
          onTimeout();
        }
      } catch (error) {
        console.error('Error checking heartbeat:', error);
      }
    };
    
    // Start monitoring
    setInterval(checkHeartbeat, 5000); // Check every 5 seconds
  }
  
  /**
   * Broadcast game state update
   */
  async broadcastGameState(gameState: any): Promise<void> {
    const message: GameMessage = {
      type: 'GAME_STATE_UPDATE',
      gameId: this.gameId,
      timestamp: Date.now(),
      data: gameState
    };
    
    await this.publishMessage('gamestate', message);
  }
  
  /**
   * Broadcast host change announcement
   */
  async announceHostChange(newHostId: string, reason: string): Promise<void> {
    const message: GameMessage = {
      type: 'HOST_CHANGED',
      gameId: this.gameId,
      timestamp: Date.now(),
      data: {
        newHostId,
        reason,
        electionTimestamp: Date.now()
      }
    };
    
    await this.publishMessage('control', message);
    console.log(`🎯 Host change announced: ${newHostId} (${reason})`);
  }
  
  /**
   * Subscribe to specific message types
   */
  async subscribeToMessages(messageType: string, handler: (message: GameMessage) => void): Promise<void> {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    
    this.messageHandlers.get(messageType)!.push(handler);
    
    if (!this.isListening) {
      this.startListening();
    }
  }
  
  /**
   * Start listening to all game streams
   */
  private async startListening(): Promise<void> {
    this.isListening = true;
    
    const streams = ['questions', 'answers', 'heartbeat', 'gamestate', 'control'];
    const streamNames = streams.map(s => this.getStreamName(s));
    
    console.log(`👂 Starting to listen on streams: ${streamNames.join(', ')}`);
    
    // Use Redis XREAD to listen for new messages
    const readStreams = async () => {
      try {
        const streamArgs = streamNames.flatMap(name => [name, '$']);
        const result = await this.redis.xread('BLOCK', 1000, 'STREAMS', ...streamArgs);
        
        if (result) {
          for (const [streamName, messages] of result) {
            for (const message of messages) {
              await this.handleIncomingMessage(streamName, message);
            }
          }
        }
      } catch (error: any) {
        if (error.message !== 'Connection is closed.') {
          console.error('Error reading streams:', error);
        }
      }
      
      if (this.isListening) {
        setImmediate(readStreams);
      }
    };
    
    readStreams();
  }
  
  /**
   * Handle incoming message from Redis stream
   */
  private async handleIncomingMessage(streamName: string, rawMessage: any): Promise<void> {
    try {
      const message = this.parseStreamMessage(rawMessage);
      
      // Only process messages for our game
      if (message.gameId !== this.gameId) {
        return;
      }
      
      const handlers = this.messageHandlers.get(message.type) || [];
      
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }
  
  /**
   * Publish message to Redis stream
   */
  private async publishMessage(streamType: string, message: GameMessage): Promise<void> {
    const streamName = this.getStreamName(streamType);
    
    await this.redis.xadd(
      streamName,
      '*',
      'type', message.type,
      'gameId', message.gameId,
      'timestamp', message.timestamp.toString(),
      'data', JSON.stringify(message.data)
    );
  }
  
  /**
   * Parse message from Redis stream format
   */
  private parseStreamMessage(rawMessage: any): GameMessage {
    const [messageId, fields] = rawMessage;
    const fieldMap = new Map();
    
    for (let i = 0; i < fields.length; i += 2) {
      fieldMap.set(fields[i], fields[i + 1]);
    }
    
    return {
      type: fieldMap.get('type'),
      gameId: fieldMap.get('gameId'),
      timestamp: parseInt(fieldMap.get('timestamp')),
      data: JSON.parse(fieldMap.get('data') || '{}')
    };
  }
  
  /**
   * Get Redis stream name for game and message type
   */
  private getStreamName(messageType: string): string {
    return `game:${this.gameId}:${messageType}`;
  }
  
  /**
   * Get recent messages from stream
   */
  async getRecentMessages(messageType: string, count: number = 10): Promise<GameMessage[]> {
    const streamName = this.getStreamName(messageType);
    
    try {
      const messages = await this.redis.xrevrange(streamName, '+', '-', 'COUNT', count);
      return messages.map(msg => this.parseStreamMessage(msg));
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }
  
  /**
   * Clear old messages from streams (cleanup)
   */
  async cleanupOldMessages(olderThanMs: number = 3600000): Promise<void> {
    const streams = ['questions', 'answers', 'heartbeat', 'gamestate', 'control'];
    const cutoffTime = Date.now() - olderThanMs;
    
    for (const streamType of streams) {
      const streamName = this.getStreamName(streamType);
      
      try {
        // Get messages older than cutoff
        const oldMessages = await this.redis.xrange(streamName, '-', cutoffTime);
        
        if (oldMessages.length > 0) {
          const messageIds = oldMessages.map(msg => msg[0]);
          await this.redis.xdel(streamName, ...messageIds);
          console.log(`🧹 Cleaned ${messageIds.length} old messages from ${streamName}`);
        }
      } catch (error) {
        console.error(`Error cleaning stream ${streamName}:`, error);
      }
    }
  }
  
  /**
   * Stop listening and cleanup
   */
  async destroy(): Promise<void> {
    this.isListening = false;
    this.messageHandlers.clear();
    
    // Cleanup old messages
    await this.cleanupOldMessages();
    
    await this.redis.quit();
    console.log(`💥 GameCoordinator destroyed for game ${this.gameId}`);
  }
} 