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
  try {
    const { student_id, quiz_score, focus_minutes } = req.body;

    console.log("📝 Daily check-in request:", { student_id, quiz_score, focus_minutes });

    // Log the daily check-in
    const { data: logData, error: logError } = await supabase
      .from("daily_logs")
      .insert([{ student_id, quiz_score, focus_minutes }])
      .select();

    if (logError) {
      console.error("❌ Error inserting daily log:", logError);
      return res.status(400).json({ error: logError.message });
    }

    console.log("✅ Daily log inserted:", logData);

    // Logic Gate
    const isSuccess = quiz_score > 7 && focus_minutes > 60;

    if (isSuccess) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ status: "normal" })
        .eq("id", student_id);

      if (updateError) {
        console.error("❌ Error updating student status:", updateError);
        return res.status(400).json({ error: updateError.message });
      }

      console.log("✅ Student status updated to normal");
      return res.json({ status: "On Track" });
    }

    // Student fails — lock and trigger n8n
    const { error: lockError } = await supabase
      .from("students")
      .update({ status: "locked" })
      .eq("id", student_id);

    if (lockError) {
      console.error("❌ Error locking student:", lockError);
      return res.status(400).json({ error: lockError.message });
    }

    console.log("🔒 Student locked, triggering n8n webhook");

    const n8nURL = process.env.n8nURL

    const n8nWebhook = `${n8nURL}/webhook/student-failed`;

    await fetch(n8nWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id, quiz_score, focus_minutes })
    });

    res.json({ status: "Pending Mentor Review" });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/assign-intervention", async (req, res) => {
  try {
    const { student_id, task } = req.body;

    console.log("📋 Assigning intervention:", { student_id, task });

    // Save intervention
    const { data: interventionData, error: interventionError } = await supabase
      .from("interventions")
      .insert([{ student_id, task }])
      .select();

    if (interventionError) {
      console.error("❌ Error inserting intervention:", interventionError);
      return res.status(400).json({ error: interventionError.message });
    }

    console.log("✅ Intervention inserted:", interventionData);

    // Unlock for remedial task
    const { error: updateError } = await supabase
      .from("students")
      .update({ status: "remedial" })
      .eq("id", student_id);

    if (updateError) {
      console.error("❌ Error updating student to remedial:", updateError);
      return res.status(400).json({ error: updateError.message });
    }

    console.log("✅ Student unlocked for remedial task");
    res.json({ message: "Intervention Assigned" });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/mark-complete", async (req, res) => {
  try {
    const { student_id } = req.body;

    console.log("✅ Marking task complete for:", student_id);

    const { error } = await supabase
      .from("students")
      .update({ status: "normal" })
      .eq("id", student_id);

    if (error) {
      console.error("❌ Error updating student status:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ status: "normal" });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("students")
      .select("status")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error fetching student status:", error);
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ status: data.status });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper endpoints for testing
app.post("/students", async (req, res) => {
  try {
    const { name } = req.body;

    console.log("👤 Creating student:", name);

    const { data, error } = await supabase
      .from("students")
      .insert([{ name: name || "New Student" }])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating student:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Student created:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/students", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching students:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Initialize database and start server
async function startServer() {
  await runMigrations();
  
  app.listen(process.env.PORT, () => {
    console.log("Backend running on port", process.env.PORT);
  });
}

startServer();
