const supabase = require('./config/supabaseClient');

async function debug() {
  console.log('🔍 Checking tables...');
  
  const tables = ['users', 'quizzes', 'quiz_categories', 'coding_practices'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table "${table}": ${error.message}`);
    } else {
      console.log(`✅ Table "${table}": Found`);
    }
  }
}

debug();
