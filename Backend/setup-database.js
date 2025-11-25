const { createTablesSQL } = require("./models/schema.js");

console.log("=" .repeat(70));
console.log("DATABASE SETUP - Copy and paste this SQL into Supabase SQL Editor");
console.log("=" .repeat(70));
console.log("\n");
console.log(createTablesSQL);
console.log("\n");
console.log("=" .repeat(70));
console.log("After running this SQL, your tables will be created automatically!");
console.log("=" .repeat(70));
