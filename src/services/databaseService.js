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
        ubiquitous_language_data TEXT,
        work_tickets_data TEXT,
        milestones_data TEXT,
        timeline_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    this.db.run(sql, (err) => {
      if (err) {
        console.error('Error creating shares table:', err);
      } else {
        console.log('Database initialized successfully');
        // 기존 테이블에 새 컬럼 추가 (이미 존재하는 경우 무시)
        this.addUbiquitousLanguageColumn();
        this.addWorkTicketsColumns();
      }
    });
  }

  addUbiquitousLanguageColumn() {
    const sql = `
      ALTER TABLE shares ADD COLUMN ubiquitous_language_data TEXT
    `;
    
    this.db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding ubiquitous_language_data column:', err);
      }
    });
  }

  addWorkTicketsColumns() {
    const columns = ['work_tickets_data', 'milestones_data', 'timeline_data'];
    
    columns.forEach(column => {
      const sql = `ALTER TABLE shares ADD COLUMN ${column} TEXT`;
      
      this.db.run(sql, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error(`Error adding ${column} column:`, err);
        }
      });
    });
  }

  saveShare(shareId, data) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO shares (id, prd_text, event_storming_data, mermaid_diagram, discussions, example_mapping_data, ubiquitous_language_data, work_tickets_data, milestones_data, timeline_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        shareId,
        data.prdText,
        JSON.stringify(data.eventStormingData),
        data.mermaidDiagram,
        JSON.stringify(data.discussions),
        JSON.stringify(data.exampleMappingData),
        JSON.stringify(data.ubiquitousLanguageData || []),
        JSON.stringify(data.workTicketsData || []),
        JSON.stringify(data.milestonesData || []),
        JSON.stringify(data.timelineData || {})
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
            ubiquitousLanguageData: row.ubiquitous_language_data ? JSON.parse(row.ubiquitous_language_data) : [],
            workTicketsData: row.work_tickets_data ? JSON.parse(row.work_tickets_data) : [],
            milestonesData: row.milestones_data ? JSON.parse(row.milestones_data) : [],
            timelineData: row.timeline_data ? JSON.parse(row.timeline_data) : {},
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