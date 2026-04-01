const supabase = require('./config/supabaseClient');
const quizzes = require('./data/quizzes.json');
const dsa = require('./data/dsa.json');

async function seed() {
  console.log('🚀 Starting Seeding Process...');

  try {
    // 1. Get or Create Categories
    const categoriesToEnsure = [
      { name: 'general', title: 'General Web Development' },
      { name: 'react', title: 'React Assessment' },
      { name: 'javascript', title: 'Javascript Assessment' },
      { name: 'nodejs', title: 'Node.js Assessment' },
      { name: 'tcs', title: 'TCS Assessment' },
      { name: 'git', title: 'Git Assessment' },
      { name: 'reasoning', title: 'Reasoning Assessment' },
      { name: 'arithmetic', title: 'Arithmetic Assessment' }
    ];

    const categoryMap = {};

    for (const cat of categoriesToEnsure) {
      let { data: category, error: catError } = await supabase
        .from('quiz_categories')
        .select('id')
        .eq('name', cat.name)
        .single();

      if (catError && catError.code !== 'PGRST116') throw catError;

      if (!category) {
        const { data: newCat, error: insError } = await supabase
          .from('quiz_categories')
          .insert([cat])
          .select()
          .single();
        if (insError) throw insError;
        category = newCat;
      }
      categoryMap[cat.name] = category.id;
      console.log(`✅ Category confirmed: ${cat.name} (${category.id})`);
    }

    // 2. Seed Quizzes
    console.log('⌛ Seeding Quizzes...');
    const quizzesToInsert = quizzes.map(q => ({
      ...q,
      category_id: categoryMap[q.category] || categoryMap['general']
    }));

    // Remove the temporary 'category' slug before insert to match schema
    quizzesToInsert.forEach(q => delete q.category);

    const { error: quizError } = await supabase
      .from('quizzes')
      .upsert(quizzesToInsert, { onConflict: 'category_id,question_text' });

    if (quizError) throw quizError;
    console.log(`✅ ${quizzes.length} Quizzes seeded.`);

    // 3. Seed Practice Challenges (All Categories)
    console.log('⌛ Seeding Practice Challenges...');
    const dsa = require('./data/dsa.json');
    const react = require('./data/react.json');
    const sql = require('./data/sql.json');
    const python = require('./data/python.json');
    const java = require('./data/java.json');

    const allPractices = [...dsa, ...react, ...sql, ...python, ...java];

    const { error: dsaError } = await supabase
      .from('coding_practices')
      .upsert(allPractices, { onConflict: 'title,description' });

    if (dsaError) throw dsaError;
    console.log(`✅ ${allPractices.length} Practice Challenges seeded across all categories.`);

    console.log('✨ Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Seeding Failed:', err.message);
  } finally {
    process.exit();
  }
}

seed();
