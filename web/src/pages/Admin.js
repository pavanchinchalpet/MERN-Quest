import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalQuestions: 0,
    totalSessions: 0
  });

  // Quiz creation states
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    category: 'Node.js',
    difficulty: 'Easy',
    timeLimit: 30
  });
  
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    quizId: ''
  });
  
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState([]);

  // Simple quiz filters
  const [quizFilters, setQuizFilters] = useState({
    search: '',
    category: ''
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, quizzesRes] = await Promise.all([
        api.get('/api/admin/users').catch(() => ({ data: [] })),
        api.get('/api/admin/quizzes').catch(() => ({ data: { quizzes: [] } }))
      ]);
      
      setUsers(usersRes.data || []);
      setQuizzes(quizzesRes.data?.quizzes || []);
      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalQuizzes: quizzesRes.data?.quizzes?.length || 0,
        totalQuestions: 0,
        totalSessions: 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleFilterChange = (key, value) => {
    setQuizFilters({ ...quizFilters, [key]: value });
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    if (quizFilters.search && !quiz.title.toLowerCase().includes(quizFilters.search.toLowerCase())) return false;
    if (quizFilters.category && quiz.category !== quizFilters.category) return false;
    return true;
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('quizFile', file);
      
      await api.post('/api/admin/upload-quiz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Quiz uploaded successfully!');
      loadDashboardData();
    } catch (error) {
      console.error('Error uploading quiz:', error);
      alert('Error uploading quiz file');
    }
  };

  const createQuiz = async () => {
    if (!newQuiz.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    
    try {
      await api.post('/api/admin/quizzes', newQuiz);
      alert('Quiz created successfully!');
      setNewQuiz({ title: '', description: '', category: 'Node.js', difficulty: 'Easy', timeLimit: 30 });
      loadDashboardData();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz');
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.quizId || !newQuestion.question.trim()) {
      alert('Please select a quiz and enter question text');
      return;
    }
    
    try {
      await api.post('/api/admin/questions', newQuestion);
      alert('Question added successfully!');
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        quizId: ''
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Error adding question');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/api/admin/quizzes/${quizId}`);
        alert('Quiz deleted successfully!');
        loadDashboardData();
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz');
      }
    }
  };

  const loadQuizQuestions = async (quizId) => {
    try {
      const response = await api.get(`/api/admin/quizzes/${quizId}/questions`);
      setSelectedQuizQuestions(response.data);
      setEditingQuiz(quizzes.find(q => q.id === quizId));
    } catch (error) {
      console.error('Error loading quiz questions:', error);
    }
  };

  const editQuiz = (quiz) => {
    setEditingQuiz({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      category: quiz.category,
      difficulty: quiz.difficulty,
      timeLimit: quiz.time_limit || quiz.timeLimit || 30
    });
  };

  const updateQuiz = async () => {
    try {
      await api.put(`/api/admin/quizzes/${editingQuiz.id}`, editingQuiz);
      alert('Quiz updated successfully!');
      setEditingQuiz(null);
      loadDashboardData();
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Error updating quiz');
    }
  };

  const SkeletonBar = ({ width = '100%', height = 16, mb = 8 }) => (
    <div style={{ width, height, background: '#1f2937', borderRadius: 4, marginBottom: mb, animation: 'pulse 1.5s ease-in-out infinite' }} />
  );

  const SkeletonStat = () => (
    <div style={styles.statCard}>
      <div style={styles.statIcon}> </div>
      <SkeletonBar width="50%" height={28} mb={6} />
      <SkeletonBar width="40%" height={12} mb={0} />
    </div>
  );

  const renderDashboard = () => (
    <div style={styles.dashboard}>
      <div style={styles.statsGrid}>
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statNumber}>{stats.totalUsers}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📝</div>
              <div style={styles.statNumber}>{stats.totalQuizzes}</div>
              <div style={styles.statLabel}>Total Quizzes</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>❓</div>
              <div style={styles.statNumber}>{stats.totalQuestions}</div>
              <div style={styles.statLabel}>Total Questions</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statNumber}>{stats.totalSessions}</div>
              <div style={styles.statLabel}>Quiz Sessions</div>
            </div>
          </>
        )}
      </div>

      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionButtons}>
          <button onClick={() => setActiveTab('quizzes')} style={styles.actionBtn}>
            📝 Manage Quizzes
          </button>
          <button onClick={() => setActiveTab('users')} style={styles.actionBtn}>
            👥 View Users
          </button>
          <button onClick={() => setActiveTab('upload')} style={styles.actionBtn}>
            📁 Upload File
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuizManagement = () => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Quiz Management</h3>
      
      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="🔍 Search quizzes..."
          style={styles.searchInput}
          value={quizFilters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select
          style={styles.selectInput}
          value={quizFilters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Node.js">Node.js</option>
          <option value="React.js">React.js</option>
          <option value="Express.js">Express.js</option>
          <option value="MongoDB">MongoDB</option>
          <option value="JavaScript">JavaScript</option>
        </select>
      </div>

      {/* Quizzes List */}
      <div style={styles.quizzesList}>
        <div style={styles.tableHeader}>
          <h4>Existing Quizzes ({filteredQuizzes.length})</h4>
          <button style={styles.btnPrimary} onClick={createQuiz}>
            + Create New Quiz
          </button>
        </div>
        
        <div style={styles.quizTable}>
          {loading ? (
            <div>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #1f2937' }}>
                  <SkeletonBar width="90%" />
                  <SkeletonBar width="60%" />
                  <SkeletonBar width="40%" />
                  <SkeletonBar width="30%" />
                  <SkeletonBar width="30%" />
                  <SkeletonBar width="50%" />
                </div>
              ))}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Difficulty</th>
                  <th style={styles.th}>Time (min)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuizzes.map(quiz => (
                  <tr key={quiz.id}>
                    <td style={styles.td}>{quiz.title}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{quiz.category}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{...styles.badge, ...getDifficultyStyle(quiz.difficulty)}}>
                        {quiz.difficulty}
                      </span>
                    </td>
                    <td style={styles.td}>{quiz.time_limit || quiz.timeLimit} min</td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, 
                        background: quiz.is_active ? '#10b981' : '#6b7280'}}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button style={styles.btnSmall} onClick={() => loadQuizQuestions(quiz.id)}>
                          View
                        </button>
                        <button style={styles.btnSmall} onClick={() => editQuiz(quiz)}>
                          Edit
                        </button>
                        <button style={{...styles.btnSmall, ...styles.btnDanger}} 
                                onClick={() => deleteQuiz(quiz.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Quiz Form */}
      <div style={styles.formSection}>
        <h4 style={styles.sectionTitle}>Create New Quiz</h4>
        <div style={styles.formGrid}>
          <input
            type="text"
            placeholder="Quiz Title"
            style={styles.input}
            value={newQuiz.title}
            onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
          />
          <textarea
            placeholder="Description (optional)"
            style={styles.textarea}
            value={newQuiz.description}
            onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
          />
          <select
            style={styles.selectInput}
            value={newQuiz.category}
            onChange={(e) => setNewQuiz({...newQuiz, category: e.target.value})}
          >
            <option value="Node.js">Node.js</option>
            <option value="React.js">React.js</option>
            <option value="Express.js">Express.js</option>
            <option value="MongoDB">MongoDB</option>
            <option value="JavaScript">JavaScript</option>
          </select>
          <select
            style={styles.selectInput}
            value={newQuiz.difficulty}
            onChange={(e) => setNewQuiz({...newQuiz, difficulty: e.target.value})}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <input
            type="number"
            placeholder="Time Limit (minutes)"
            style={styles.input}
            value={newQuiz.timeLimit}
            onChange={(e) => setNewQuiz({...newQuiz, timeLimit: parseInt(e.target.value)})}
          />
        </div>
        <button style={styles.btnPrimary} onClick={createQuiz}>
          Create Quiz
        </button>
      </div>

      {/* Add Question Form */}
      <div style={styles.formSection}>
        <h4 style={styles.sectionTitle}>Add Question</h4>
        <div style={styles.formGrid}>
          <select
            style={styles.selectInput}
            value={newQuestion.quizId}
            onChange={(e) => setNewQuestion({...newQuestion, quizId: e.target.value})}
          >
            <option value="">Select Quiz</option>
            {quizzes.map(quiz => (
              <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
            ))}
          </select>
          <textarea
            placeholder="Question Text"
            style={styles.textarea}
            value={newQuestion.question}
            onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
            rows="3"
          />
          {newQuestion.options.map((option, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Option ${index + 1}`}
              style={styles.input}
              value={option}
              onChange={(e) => {
                const newOptions = [...newQuestion.options];
                newOptions[index] = e.target.value;
                setNewQuestion({...newQuestion, options: newOptions});
              }}
            />
          ))}
          <select
            style={styles.selectInput}
            value={newQuestion.correctAnswer}
            onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: parseInt(e.target.value)})}
          >
            <option value={0}>Option 1 is Correct</option>
            <option value={1}>Option 2 is Correct</option>
            <option value={2}>Option 3 is Correct</option>
            <option value={3}>Option 4 is Correct</option>
          </select>
        </div>
        <button style={styles.btnPrimary} onClick={addQuestion}>
          Add Question
        </button>
      </div>

      {/* Questions List */}
      {selectedQuizQuestions.length > 0 && (
        <div style={styles.formSection}>
          <h4 style={styles.sectionTitle}>
            Questions for: {editingQuiz?.title} ({selectedQuizQuestions.length})
          </h4>
          <div style={styles.questionsList}>
            {selectedQuizQuestions.map((question, index) => (
              <div key={question.id} style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <span style={styles.questionNumber}>Q{index + 1}</span>
                  <span style={styles.statusBadge}>Option {question.correct_answer + 1} is correct</span>
                </div>
                <p style={styles.questionText}>{question.question_text}</p>
                <div style={styles.optionsList}>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} style={{
                      ...styles.option,
                      background: optIndex === question.correct_answer ? '#10b981' : '#374151'
                    }}>
                      {optIndex + 1}. {option}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {editingQuiz && !selectedQuizQuestions.length && (
        <div style={styles.modalOverlay} onClick={() => setEditingQuiz(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Edit Quiz</h3>
              <button style={styles.closeBtn} onClick={() => setEditingQuiz(null)}>×</button>
            </div>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Quiz Title"
                style={styles.input}
                value={editingQuiz.title}
                onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
              />
              <textarea
                placeholder="Description"
                style={styles.textarea}
                value={editingQuiz.description}
                onChange={(e) => setEditingQuiz({...editingQuiz, description: e.target.value})}
              />
              <select
                style={styles.selectInput}
                value={editingQuiz.category}
                onChange={(e) => setEditingQuiz({...editingQuiz, category: e.target.value})}
              >
                <option value="Node.js">Node.js</option>
                <option value="React.js">React.js</option>
                <option value="Express.js">Express.js</option>
                <option value="MongoDB">MongoDB</option>
                <option value="JavaScript">JavaScript</option>
              </select>
              <select
                style={styles.selectInput}
                value={editingQuiz.difficulty}
                onChange={(e) => setEditingQuiz({...editingQuiz, difficulty: e.target.value})}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <input
                type="number"
                placeholder="Time Limit (minutes)"
                style={styles.input}
                value={editingQuiz.timeLimit}
                onChange={(e) => setEditingQuiz({...editingQuiz, timeLimit: parseInt(e.target.value)})}
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnPrimary} onClick={updateQuiz}>Update Quiz</button>
              <button style={styles.btnSecondary} onClick={() => setEditingQuiz(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUserManagement = () => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>User Management</h3>
      <div style={styles.tableContainer}>
        {loading ? (
          <div>
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #1f2937' }}>
                <SkeletonBar width="90%" />
                <SkeletonBar width="80%" />
                <SkeletonBar width="50%" />
                <SkeletonBar width="30%" />
              </div>
            ))}
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Quizzes Taken</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.name}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>
                      {user.role || (user.is_admin ? 'admin' : 'user')}
                    </span>
                  </td>
                  <td style={styles.td}>{user.quizzes_taken || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderFileUpload = () => (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>File Upload</h3>
      <div style={styles.uploadArea}>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          style={styles.fileInput}
          id="quiz-file-upload"
        />
        <label htmlFor="quiz-file-upload" style={styles.uploadLabel}>
          <div style={styles.uploadContent}>
            <div style={styles.uploadIcon}>📁</div>
            <div>Click to upload quiz file</div>
            <div style={styles.uploadHint}>Supports CSV and JSON formats</div>
          </div>
        </label>
      </div>
    </div>
  );

  const getDifficultyStyle = (difficulty) => {
    const styles = {
      'Easy': { background: '#10b981' },
      'Medium': { background: '#f59e0b' },
      'Hard': { background: '#ef4444' }
    };
    return styles[difficulty] || { background: '#6b7280' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>⚙️ Admin Dashboard</h1>
        <p>Quiz Sprint - Manage your platform</p>
      </div>

      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(activeTab === 'dashboard' && styles.tabActive)}}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'quizzes' && styles.tabActive)}}
          onClick={() => setActiveTab('quizzes')}
        >
          📝 Quizzes
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'users' && styles.tabActive)}}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'upload' && styles.tabActive)}}
          onClick={() => setActiveTab('upload')}
        >
          📁 Upload
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'quizzes' && renderQuizManagement()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'upload' && renderFileUpload()}
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: '#0f172a',
    minHeight: '100vh',
    color: '#e5e7eb'
  },
  header: {
    background: 'linear-gradient(135deg, #111827, #0b1220)',
    padding: '2rem',
    borderBottom: '1px solid #1f2937',
    textAlign: 'center'
  },
  tabs: {
    display: 'flex',
    background: '#111827',
    borderBottom: '1px solid #1f2937',
    padding: '0 2rem'
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '1rem 1.5rem',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s ease'
  },
  tabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6'
  },
  content: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  spinner: {
    fontSize: '1.5rem',
    color: '#94a3b8'
  },
  dashboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  statCard: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    textAlign: 'center'
  },
  statIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3b82f6',
    display: 'block'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    marginTop: '0.25rem'
  },
  quickActions: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding: '1.5rem'
  },
  actionButtons: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginTop: '1rem'
  },
  actionBtn: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500'
  },
  section: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding: '2rem'
  },
  sectionTitle: {
    color: '#f8fafc',
    marginBottom: '1rem',
    fontSize: '1.25rem'
  },
  filterBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem'
  },
  searchInput: {
    flex: 1,
    background: '#0b1220',
    border: '1px solid #1f2937',
    color: '#e5e7eb',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem'
  },
  selectInput: {
    background: '#0b1220',
    border: '1px solid #1f2937',
    color: '#e5e7eb',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem'
  },
  formSection: {
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #1f2937'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem'
  },
  input: {
    background: '#0b1220',
    border: '1px solid #1f2937',
    color: '#e5e7eb',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem'
  },
  textarea: {
    background: '#0b1220',
    border: '1px solid #1f2937',
    color: '#e5e7eb',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    resize: 'vertical',
    minHeight: '100px'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500'
  },
  btnSecondary: {
    background: '#374151',
    color: '#e5e7eb',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500'
  },
  btnSmall: {
    background: '#374151',
    color: '#e5e7eb',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginRight: '0.5rem'
  },
  btnDanger: {
    background: '#dc2626',
    color: 'white'
  },
  quizTable: {
    marginTop: '1rem',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    background: '#0b1220',
    color: '#f8fafc',
    padding: '0.75rem',
    textAlign: 'left',
    borderBottom: '1px solid #1f2937',
    fontWeight: '600'
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #1f2937',
    color: '#e5e7eb'
  },
  badge: {
    background: '#3b82f6',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  statusBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    background: '#10b981',
    color: 'white'
  },
  quizzesList: {
    marginTop: '1rem'
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  questionCard: {
    background: '#0b1220',
    border: '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding: '1rem'
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  questionNumber: {
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#3b82f6'
  },
  questionText: {
    color: '#e5e7eb',
    marginBottom: '0.5rem'
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  option: {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    background: '#374151',
    color: '#e5e7eb'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '0.5rem',
    padding: '2rem',
    maxWidth: '600px',
    width: '90%'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: 0,
    width: '2rem',
    height: '2rem'
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem'
  },
  uploadArea: {
    border: '2px dashed #1f2937',
    borderRadius: '0.5rem',
    padding: '3rem',
    textAlign: 'center'
  },
  fileInput: {
    display: 'none'
  },
  uploadLabel: {
    cursor: 'pointer',
    display: 'block'
  },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  uploadIcon: {
    fontSize: '3rem'
  },
  uploadHint: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  tableContainer: {
    overflowX: 'auto'
  }
};

export default Admin;