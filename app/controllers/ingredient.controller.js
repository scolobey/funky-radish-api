const { createClient } = require('@supabase/supabase-js');
const config = require('config');

const supabaseUrl = process.env.SUPABASE_URI || config.get('SUPABASE_URI')
const supabaseKey = process.env.SUPABASE_KEY || config.get('SUPABASE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey);

// Scan ingredients. Collect statistics.
exports.search = async (req, res) => {
  console.log("getting ingredient: " + req.params.query);

  let query = req.params.query
  let data = await getIngredients(query)

  res.send(JSON.stringify(data))
}

const getIngredients = async (ingName) => {

  const { data, error } = await supabase
    .from('ingredients')
    .select()
    .eq('name', ingName)

  return data
};
