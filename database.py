import sqlite3
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
import os

class SearchHistoryDB:
    def __init__(self, db_path: str = "search_history.db"):
        """Initialize the search history database"""
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Create the database tables if they don't exist"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS search_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_hash TEXT UNIQUE NOT NULL,
                    analysis_type TEXT NOT NULL,
                    content_preview TEXT NOT NULL,
                    file_name TEXT,
                    file_size INTEGER,
                    results JSON NOT NULL,
                    risk_score REAL NOT NULL,
                    confidence REAL NOT NULL,
                    verdict TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    user_notes TEXT,
                    is_favorite BOOLEAN DEFAULT FALSE
                )
            ''')
            
            # Create indexes for better performance
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_timestamp ON search_history(timestamp DESC)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_analysis_type ON search_history(analysis_type)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_risk_score ON search_history(risk_score)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_is_favorite ON search_history(is_favorite)
            ''')
            
            conn.commit()
    
    def _generate_content_hash(self, content: str, analysis_type: str) -> str:
        """Generate a unique hash for the content"""
        content_str = f"{analysis_type}:{content}"
        return hashlib.sha256(content_str.encode()).hexdigest()[:16]
    
    def add_search(self, 
                   analysis_type: str,
                   content: str,
                   results: Dict[str, Any],
                   file_name: Optional[str] = None,
                   file_size: Optional[int] = None) -> int:
        """Add a new search to history"""
        
        # Generate content hash
        content_hash = self._generate_content_hash(content, analysis_type)
        
        # Create content preview
        if analysis_type == 'text':
            content_preview = content[:200] + "..." if len(content) > 200 else content
        else:
            content_preview = file_name or f"{analysis_type.title()} file"
        
        # Extract key metrics from results
        risk_score = results.get('deepfake_score', results.get('misinformation_score', 0.0))
        confidence = results.get('confidence', 0.0)
        
        # Extract verdict
        verdict = 'Unknown'
        if 'analysis' in results and isinstance(results['analysis'], dict):
            gemini_analysis = results['analysis'].get('gemini_analysis', {})
            if gemini_analysis:
                verdict = gemini_analysis.get('deepfake_verdict', 
                         gemini_analysis.get('fake_news_verdict', 'Unknown'))
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    INSERT INTO search_history 
                    (content_hash, analysis_type, content_preview, file_name, file_size, 
                     results, risk_score, confidence, verdict)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    content_hash,
                    analysis_type,
                    content_preview,
                    file_name,
                    file_size,
                    json.dumps(results),
                    risk_score,
                    confidence,
                    verdict
                ))
                
                search_id = cursor.lastrowid
                conn.commit()
                return search_id
                
            except sqlite3.IntegrityError:
                # Entry already exists, update it
                cursor.execute('''
                    UPDATE search_history 
                    SET results = ?, risk_score = ?, confidence = ?, verdict = ?, 
                        timestamp = CURRENT_TIMESTAMP
                    WHERE content_hash = ?
                ''', (
                    json.dumps(results),
                    risk_score,
                    confidence,
                    verdict,
                    content_hash
                ))
                
                # Get the existing ID
                cursor.execute('SELECT id FROM search_history WHERE content_hash = ?', (content_hash,))
                search_id = cursor.fetchone()[0]
                conn.commit()
                return search_id
    
    def get_search_history(self, 
                          limit: int = 50,
                          analysis_type: Optional[str] = None,
                          min_risk: Optional[float] = None,
                          max_risk: Optional[float] = None,
                          favorites_only: bool = False) -> List[Dict[str, Any]]:
        """Get search history with optional filters"""
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = '''
                SELECT id, analysis_type, content_preview, file_name, file_size,
                       risk_score, confidence, verdict, timestamp, user_notes, is_favorite
                FROM search_history
                WHERE 1=1
            '''
            params = []
            
            if analysis_type:
                query += ' AND analysis_type = ?'
                params.append(analysis_type)
            
            if min_risk is not None:
                query += ' AND risk_score >= ?'
                params.append(min_risk)
            
            if max_risk is not None:
                query += ' AND risk_score <= ?'
                params.append(max_risk)
            
            if favorites_only:
                query += ' AND is_favorite = TRUE'
            
            query += ' ORDER BY timestamp DESC LIMIT ?'
            params.append(limit)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            return [dict(row) for row in rows]
    
    def get_search_by_id(self, search_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific search by ID with full results"""
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM search_history WHERE id = ?
            ''', (search_id,))
            
            row = cursor.fetchone()
            if row:
                result = dict(row)
                result['results'] = json.loads(result['results'])
                return result
            return None
    
    def delete_search(self, search_id: int) -> bool:
        """Delete a search from history"""
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM search_history WHERE id = ?', (search_id,))
            deleted = cursor.rowcount > 0
            conn.commit()
            return deleted
    
    def toggle_favorite(self, search_id: int) -> bool:
        """Toggle favorite status of a search"""
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE search_history 
                SET is_favorite = NOT is_favorite 
                WHERE id = ?
            ''', (search_id,))
            
            updated = cursor.rowcount > 0
            conn.commit()
            return updated
    
    def add_note(self, search_id: int, note: str) -> bool:
        """Add or update a note for a search"""
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE search_history 
                SET user_notes = ? 
                WHERE id = ?
            ''', (note, search_id))
            
            updated = cursor.rowcount > 0
            conn.commit()
            return updated
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get search history statistics"""
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Total searches
            cursor.execute('SELECT COUNT(*) FROM search_history')
            total_searches = cursor.fetchone()[0]
            
            # Searches by type
            cursor.execute('''
                SELECT analysis_type, COUNT(*) 
                FROM search_history 
                GROUP BY analysis_type
            ''')
            by_type = dict(cursor.fetchall())
            
            # Risk distribution
            cursor.execute('''
                SELECT 
                    SUM(CASE WHEN risk_score < 0.3 THEN 1 ELSE 0 END) as low_risk,
                    SUM(CASE WHEN risk_score >= 0.3 AND risk_score < 0.7 THEN 1 ELSE 0 END) as medium_risk,
                    SUM(CASE WHEN risk_score >= 0.7 THEN 1 ELSE 0 END) as high_risk
                FROM search_history
            ''')
            risk_dist = cursor.fetchone()
            
            # Recent activity (last 7 days)
            cursor.execute('''
                SELECT COUNT(*) 
                FROM search_history 
                WHERE datetime(timestamp) >= datetime('now', '-7 days')
            ''')
            recent_activity = cursor.fetchone()[0]
            
            return {
                'total_searches': total_searches,
                'by_type': by_type,
                'risk_distribution': {
                    'low': risk_dist[0] or 0,
                    'medium': risk_dist[1] or 0,
                    'high': risk_dist[2] or 0
                },
                'recent_activity': recent_activity
            }
    
    def clear_history(self, older_than_days: Optional[int] = None) -> int:
        """Clear search history, optionally only entries older than specified days"""
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            if older_than_days:
                cursor.execute('''
                    DELETE FROM search_history 
                    WHERE datetime(timestamp) < datetime('now', '-{} days')
                '''.format(older_than_days))
            else:
                cursor.execute('DELETE FROM search_history')
            
            deleted_count = cursor.rowcount
            conn.commit()
            return deleted_count