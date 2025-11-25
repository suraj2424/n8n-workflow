const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { supabase } = require("./supabase.js");
const { runMigrations } = require("./models/migrate.js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/daily-checkin", async (req, res) => {
  const { student_id, quiz_score, focus_minutes } = req.body;

  // Log the daily check-in
  await supabase.from("daily_logs").insert([
    { student_id, quiz_score, focus_minutes }
  ]);

  // Logic Gate
  const isSuccess = quiz_score > 7 && focus_minutes > 60;

  if (isSuccess) {
    await supabase
      .from("students")
      .update({ status: "normal" })
      .eq("id", student_id);

    return res.json({ status: "On Track" });
  }

  // Student fails — lock and trigger n8n
  await supabase
    .from("students")
    .update({ status: "locked" })
    .eq("id", student_id);

  const n8nWebhook = "https://suraj2424.app.n8n.cloud/webhook-test/student-failed";

  await fetch(n8nWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id, quiz_score, focus_minutes })
  });

  res.json({ status: "Pending Mentor Review" });
});

app.post("/assign-intervention", async (req, res) => {
  const { student_id, task } = req.body;

  // Save intervention
  await supabase.from("interventions").insert([
    { student_id, task }
  ]);

  // Unlock for remedial task
  await supabase
    .from("students")
    .update({ status: "remedial" })
    .eq("id", student_id);

  res.json({ message: "Intervention Assigned" });
});

app.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  const { data } = await supabase
    .from("students")
    .select("status")
    .eq("id", id)
    .single();

  res.json({ status: data.status });
});


// Initialize database and start server
async function startServer() {
  await runMigrations();
  
  app.listen(process.env.PORT, () => {
    console.log("Backend running on port", process.env.PORT);
  });
}

startServer();
