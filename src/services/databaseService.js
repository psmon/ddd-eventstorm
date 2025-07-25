const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '..', 'data', 'shares.db');
    const dbDir = path.dirname(dbPath);
    
    const fs = require('fs');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    const sql = `
      CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        prd_text TEXT NOT NULL,
        event_storming_data TEXT NOT NULL,
        mermaid_diagram TEXT,
        discussions TEXT,
        example_mapping_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    this.db.run(sql, (err) => {
      if (err) {
        console.error('Error creating shares table:', err);
      } else {
        console.log('Database initialized successfully');
      }
    });
  }

  saveShare(shareId, data) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO shares (id, prd_text, event_storming_data, mermaid_diagram, discussions, example_mapping_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        shareId,
        data.prdText,
        JSON.stringify(data.eventStormingData),
        data.mermaidDiagram,
        JSON.stringify(data.discussions),
        JSON.stringify(data.exampleMappingData)
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(shareId);
        }
      });
    });
  }

  getShare(shareId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM shares WHERE id = ?
      `;
      
      this.db.get(sql, [shareId], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          this.updateAccessTime(shareId);
          
          resolve({
            id: row.id,
            prdText: row.prd_text,
            eventStormingData: JSON.parse(row.event_storming_data),
            mermaidDiagram: row.mermaid_diagram,
            discussions: JSON.parse(row.discussions),
            exampleMappingData: JSON.parse(row.example_mapping_data),
            createdAt: row.created_at
          });
        }
      });
    });
  }

  updateAccessTime(shareId) {
    const sql = `
      UPDATE shares SET accessed_at = CURRENT_TIMESTAMP WHERE id = ?
    `;
    
    this.db.run(sql, [shareId]);
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();