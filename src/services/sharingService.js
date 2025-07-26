const { nanoid } = require('nanoid');
const databaseService = require('./databaseService');

class SharingService {
  generateShortId() {
    return nanoid(8);
  }

  async createShare(analysisData) {
    const shareId = this.generateShortId();
    
    const shareData = {
      prdText: analysisData.prdText,
      eventStormingData: analysisData.eventStormingData,
      mermaidDiagram: analysisData.mermaidDiagram,
      discussions: analysisData.discussions,
      exampleMappingData: analysisData.exampleMappingData,
      ubiquitousLanguageData: analysisData.ubiquitousLanguageData,
      workTicketsData: analysisData.workTicketsData,
      milestonesData: analysisData.milestonesData,
      timelineData: analysisData.timelineData
    };
    
    try {
      await databaseService.saveShare(shareId, shareData);
      return shareId;
    } catch (error) {
      console.error('Error creating share:', error);
      throw new Error('Failed to create share');
    }
  }

  async getShare(shareId) {
    try {
      const shareData = await databaseService.getShare(shareId);
      return shareData;
    } catch (error) {
      console.error('Error retrieving share:', error);
      throw new Error('Failed to retrieve share');
    }
  }

  getShareUrl(shareId, protocol, host) {
    return `${protocol}://${host}/share/${shareId}`;
  }
}

module.exports = new SharingService();