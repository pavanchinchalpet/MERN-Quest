const supabase = require('./config/supabaseClient');
const quizzes = require('./data/quizzes.json');
const dsa = require('./data/dsa.json');

async function seed() {
  console.log('🚀 Starting Seeding Process...');

  try {
    // 1. Get or Create 'General' Category
    let { data: category, error: catError } = await supabase
      .from('quiz_categories')
      .select('id')
      .eq('name', 'general')
      .single();

    if (catError && catError.code !== 'PGRST116') throw catError;

    if (!category) {
      const { data: newCat, error: insError } = await supabase
        .from('quiz_categories')
        .insert([{ name: 'general', title: 'General Web Development' }])
        .select()
        .single();
      if (insError) throw insError;
      category = newCat;
    }

    console.log('✅ Category confirmed:', category.id);

    // 2. Seed Quizzes
    console.log('⌛ Seeding Quizzes...');
    const quizzesToInsert = quizzes.map(q => ({
      ...q,
      category_id: category.id
    }));

    const { error: quizError } = await supabase
      .from('quizzes')
      .insert(quizzesToInsert);

    if (quizError) throw quizError;
    console.log(`✅ ${quizzes.length} Quizzes seeded.`);

    // 3. Seed DSA Challenges
    console.log('⌛ Seeding DSA Challenges...');
    const { error: dsaError } = await supabase
      .from('coding_practices')
      .insert(dsa);

    if (dsaError) throw dsaError;
    console.log(`✅ ${dsa.length} DSA Challenges seeded.`);

    console.log('✨ Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Seeding Failed:', err.message);
  } finally {
    process.exit();
  }
}

seed();
