/**
 * Feature Manager for P2P Mobile Game Architecture
 */

export type AccountType = 'FREE' | 'PREMIUM' | 'ADMIN';

export interface FeatureSet {
  canCreateGame: boolean;
  canHostGame: boolean;
  canUploadQuestions: boolean;
  canUploadMusic: boolean;
  hasAdvancedStats: boolean;
  hasNoAds: boolean;
  emergencyModeActive: boolean;
  maxQuestionSets: number;
  maxMusicTracks: number;
}

export class FeatureManager {
  private userAccountType: AccountType;
  private emergencyMode: boolean = false;
  
  constructor(accountType: AccountType) {
    this.userAccountType = accountType;
  }
  
  canCreateGame(): boolean {
    return this.userAccountType === 'PREMIUM' || 
           this.userAccountType === 'ADMIN';
  }
  
  canHostGame(): boolean {
    return this.userAccountType === 'PREMIUM' || 
           this.userAccountType === 'ADMIN' || 
           this.emergencyMode;
  }
  
  activateEmergencyMode(): void {
    console.log('🚨 EMERGENCY MODE: Activating server features for FREE user');
    this.emergencyMode = true;
  }
  
  deactivateEmergencyMode(): void {
    this.emergencyMode = false;
  }
  
  getAvailableFeatures(): FeatureSet {
    return {
      canCreateGame: this.canCreateGame(),
      canHostGame: this.canHostGame(),
      canUploadQuestions: this.userAccountType !== 'FREE',
      canUploadMusic: this.userAccountType !== 'FREE',
      hasAdvancedStats: this.userAccountType !== 'FREE',
      hasNoAds: this.userAccountType !== 'FREE',
      emergencyModeActive: this.emergencyMode,
      maxQuestionSets: this.userAccountType === 'FREE' ? 0 : 50,
      maxMusicTracks: this.userAccountType === 'FREE' ? 0 : 100
    };
  }
} 