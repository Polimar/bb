// Server Election Algorithm for P2P Mobile Game Architecture
interface PeerInfo {
  id: string;
  accountType: 'FREE' | 'PREMIUM' | 'ADMIN';
  connectionStability: number; // 0-100
  batteryLevel: number; // 0-100
  isHost: boolean;
  lastSeen: number; // timestamp
}

interface GamePeerInfo extends PeerInfo {
  gameId: string;
  playerUsername: string;
  deviceInfo: {
    platform: 'android' | 'ios';
    osVersion: string;
    appVersion: string;
  };
}

export class ServerElectionManager {
  private peers: Map<string, GamePeerInfo> = new Map();
  private currentHost: string | null = null;
  private gameId: string;
  private myPeerId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor(gameId: string, myPeerId: string) {
    this.gameId = gameId;
    this.myPeerId = myPeerId;
  }
  
  /**
   * Core election algorithm with P2P priorities
   * 1. PREMIUM/ADMIN accounts (can always host)
   * 2. Highest connection stability
   * 3. Highest battery level
   * 4. Alphabetical ID (deterministic fallback)
   */
  electNewHost(peers: GamePeerInfo[]): string {
    if (peers.length === 0) return this.myPeerId;
    
    const sortedPeers = peers.sort((a, b) => {
      // Premium priority - PREMIUM/ADMIN always wins over FREE
      const aIsPremium = a.accountType === 'PREMIUM' || a.accountType === 'ADMIN';
      const bIsPremium = b.accountType === 'PREMIUM' || b.accountType === 'ADMIN';
      
      if (aIsPremium && !bIsPremium) return -1;
      if (!aIsPremium && bIsPremium) return 1;
      
      // Connection stability - higher is better
      if (a.connectionStability !== b.connectionStability) {
        return b.connectionStability - a.connectionStability;
      }
      
      // Battery level - higher is better
      if (a.batteryLevel !== b.batteryLevel) {
        return b.batteryLevel - a.batteryLevel;
      }
      
      // Deterministic fallback - alphabetical
      return a.id.localeCompare(b.id);
    });
    
    return sortedPeers[0].id;
  }
  
  /**
   * Handle host disconnection - Emergency server activation
   */
  handleHostDisconnection(): string | null {
    console.log('🚨 Host disconnected - initiating emergency election');
    
    const availablePeers = Array.from(this.peers.values())
      .filter(p => p.id !== this.currentHost && this.isPeerAlive(p));
    
    if (availablePeers.length === 0) {
      console.log('🔴 No available peers - becoming solo host');
      return this.promoteToHost(this.myPeerId);
    }
    
    // Include myself in election
    const allCandidates = [...availablePeers];
    const newHost = this.electNewHost(allCandidates);
    
    console.log(`🎯 New host elected: ${newHost}`);
    return this.promoteToHost(newHost);
  }
  
  /**
   * Promote peer to host (including emergency promotion for FREE users)
   */
  private promoteToHost(peerId: string): string {
    this.currentHost = peerId;
    
    if (peerId === this.myPeerId) {
      console.log('🚨 EMERGENCY PROMOTION: Activating server features');
      this.activateHostMode();
    }
    
    // Broadcast new host announcement
    this.broadcastHostChange(peerId);
    
    return peerId;
  }
  
  /**
   * Activate host mode (even for FREE users in emergency)
   */
  private activateHostMode(): void {
    console.log('🎮 Activating ALL server features:');
    console.log('  ✅ Question distribution system');
    console.log('  ✅ Timer management');
    console.log('  ✅ Score tracking');
    console.log('  ✅ Answer collection');
    console.log('  ✅ Game state management');
    
    // Start heartbeat as new host
    this.startHostHeartbeat();
    
    // Emit event to mobile app to activate server UI
    this.emitHostActivation();
  }
  
  /**
   * Check if peer is still alive (within heartbeat timeout)
   */
  private isPeerAlive(peer: GamePeerInfo): boolean {
    const HEARTBEAT_TIMEOUT = 10000; // 10 seconds
    return (Date.now() - peer.lastSeen) < HEARTBEAT_TIMEOUT;
  }
  
  /**
   * Start heartbeat monitoring for current host
   */
  startHostMonitoring(): void {
    setInterval(() => {
      if (this.currentHost && this.currentHost !== this.myPeerId) {
        const host = this.peers.get(this.currentHost);
        if (!host || !this.isPeerAlive(host)) {
          console.log(`💔 Host ${this.currentHost} heartbeat timeout`);
          this.handleHostDisconnection();
        }
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Start sending heartbeat as host
   */
  private startHostHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      this.sendHostHeartbeat();
    }, 3000); // Send every 3 seconds
  }
  
  /**
   * Send heartbeat to all peers
   */
  private sendHostHeartbeat(): void {
    const heartbeat = {
      type: 'HOST_HEARTBEAT',
      hostId: this.myPeerId,
      timestamp: Date.now(),
      gameId: this.gameId
    };
    
    // Send via WebRTC or Redis Streams
    this.broadcastToPeers(heartbeat);
  }
  
  /**
   * Update peer information
   */
  updatePeer(peerId: string, peerInfo: Partial<GamePeerInfo>): void {
    const existing = this.peers.get(peerId) || {} as GamePeerInfo;
    this.peers.set(peerId, {
      ...existing,
      ...peerInfo,
      id: peerId,
      lastSeen: Date.now()
    });
  }
  
  /**
   * Remove peer from election pool
   */
  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    
    if (peerId === this.currentHost) {
      this.handleHostDisconnection();
    }
  }
  
  /**
   * Get current game state summary
   */
  getElectionState() {
    return {
      currentHost: this.currentHost,
      peerCount: this.peers.size,
      peers: Array.from(this.peers.values()),
      canIHost: this.canBecomeHost(),
      myRole: this.currentHost === this.myPeerId ? 'HOST' : 'CLIENT'
    };
  }
  
  /**
   * Check if current user can become host
   */
  private canBecomeHost(): boolean {
    // Premium can always host
    // FREE can host only in emergency
    const myInfo = this.peers.get(this.myPeerId);
    if (!myInfo) return false;
    
    return myInfo.accountType === 'PREMIUM' || 
           myInfo.accountType === 'ADMIN' || 
           this.isEmergencyMode();
  }
  
  /**
   * Check if we're in emergency mode (no premium hosts available)
   */
  private isEmergencyMode(): boolean {
    const premiumPeers = Array.from(this.peers.values())
      .filter(p => (p.accountType === 'PREMIUM' || p.accountType === 'ADMIN') && this.isPeerAlive(p));
    
    return premiumPeers.length === 0;
  }
  
  /**
   * Broadcast host change to all peers
   */
  private broadcastHostChange(newHostId: string): void {
    const announcement = {
      type: 'HOST_CHANGED',
      newHostId,
      gameId: this.gameId,
      timestamp: Date.now(),
      reason: 'ELECTION'
    };
    
    this.broadcastToPeers(announcement);
  }
  
  /**
   * Emit host activation event to mobile app
   */
  private emitHostActivation(): void {
    // This would emit to the mobile app's event system
    // to show host UI and activate server features
    console.log('📱 Emitting HOST_ACTIVATION event to mobile app');
  }
  
  /**
   * Broadcast message to all peers (via WebRTC/Redis)
   */
  private broadcastToPeers(message: any): void {
    // Implementation would use WebRTC data channels or Redis Streams
    console.log('📡 Broadcasting to peers:', message);
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.peers.clear();
  }
} 