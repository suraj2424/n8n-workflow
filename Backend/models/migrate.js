const { supabase } = require("../supabase.js");
const { createTablesSQL } = require("./schema.js");

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    
    // Check if tables already exist by trying to query them
    const { error: studentsError } = await supabase
      .from("students")
      .select("id")
      .limit(1);

    if (!studentsError) {
      console.log("✅ Tables already exist. Skipping migration.");
      return true;
    }

    // Tables don't exist, show SQL for manual creation
    console.log("\n⚠️  Tables need to be created.");
    console.log("📝 Please run this SQL in your Supabase SQL Editor:\n");
    console.log("=" .repeat(60));
    console.log(createTablesSQL);
    console.log("=" .repeat(60));
    console.log("\nℹ️  After running the SQL, restart your server.\n");
    
    return false;
  } catch (error) {
    console.error("❌ Migration check failed:", error.message);
    return false;
  }
}

module.exports = { runMigrations };
