import express from 'express'
import dotenv from 'dotenv'
import  supabase from './public/config/supabaseClient.js'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from "cors";
import multer from "multer";
import fs from "fs";

dotenv.config()
const app = express();

app.use(cors()); //Allow frontend to communicate with backend securely during local or deployed testing
app.use(express.json());

//const __filename = fileURLToPath(import.meta.url)
const __dirname = path.resolve();

// Serve everything inside "public" folder
app.use(express.static(path.join(__dirname, "public")));


app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/landingpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'landingPage.html'));
});

//Get the Logged in user ID
//const user = await supabase.auth.getUser();
// let loggedin_user_id; // = user.id;

//handle signin request
app.post("/signin", async (req, res) => {
  const {email, password} = req.body;
  console.log(req.body);

   try{
    const { data: user, error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signinError) {
      console.error("Sign in error:", signinError.message);
      return res.status(400).json({ error: signinError.message });
    }
    console.log(user.user.id);
    // res.json({ message: "User Logged In successfully", userID: user.id }); 
    res.status(200).json({
    message: "Signin successful",
    redirect: "../views/landingpage.html",  // optional hint
    userID: user.user.id,
    });
   }
   catch (err)
   {
      console.error("Server error:", err.message);
      res.status(500).json({ error: "Internal server error" });
   }
}
);

// Handle signup request
app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, phone, createdAt } = req.body;
  console.log(req.body);

  try {
    // 1. Create user in Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm, or set false if you want email verification
    });

    if (authError) {
      console.error("Auth error:", authError.message);
      return res.status(400).json({ error: authError.message });
    }

    const user = userData.user;

    // 2. Insert into Student table
    const { error: insertError } = await supabase.from("student").insert([
      {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        created_at : createdAt,
      },
    ]);

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    res.json({ message: "User created successfully", userID: user.id });

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/logout', async (req, res) =>{

  let { error: logOutError } = await supabase.auth.signOut();

  if (logOutError) {
      console.error("Auth error:", logOutError.message);
      return res.status(400).json({ error: logOutError.message });
    }

  res.status(200).json({
    message: "Logout successful",
    redirect: "../index",  // optional hint
    });
});

/* Book Valuator Logic */
const GOOGLE_API_KEY = "AIzaSyCIFuQZQQ27r1mlPo6ynPCoeTbnppqyDlQ";

async function getBookInfoFromISBN(isbn) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const volume = data.items[0].volumeInfo;
      return {
        title: volume.title,
        authors: volume.authors || [],
        publishedDate: volume.publishedDate || "Unknown"
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching book info:", err);
    return null;
  }
}

app.post('/bookValuator', async (req, res) => {
  try{
    const bookData = req.body;

    //Fetch Book title and Author using ISBN
    const bookInfo = await getBookInfoFromISBN(bookData.isbn)

    const titlePart = bookInfo
    ? `The book is "${bookInfo.title}" by ${bookInfo.authors.join(", ")}.`
    : "The book title could not be found via ISBN lookup.";


    if (!bookData || !bookData.isbn) {
      return res.status(400).json({ error: "Invalid book data provided." });
    }

    const SYSTEM_PROMPT = `
    You are an expert used book appraiser. Your task is to predict the market value of a used book based on its attributes.

    Respond only in clean JSON format:
    {
      "predicted_value": <number>,
      "reasoning": "<short explanation>"
    }

    Guidelines:
    - Start from an estimated new price.
    - 'Like New' retains most value; 'Acceptable' the least.
    - Hardcovers > paperbacks.
    - First editions and signed copies are more valuable.
    - Each damage decreases value.
    - Major defects (like a broken spine) greatly reduce it.
    -All values are in pounds.

    ${titlePart}
    When explaining, explicitly mention the book’s title (if available) and how its specific attributes affect the valuation.
        `;

    //Build user query text
    const userQuery = `
    Appraise this book based on the following data:
    ${JSON.stringify(bookData, null, 2)}`;

    //console.log(userQuery);

    //Build the Payload for the Google API
    const payload = {
      contents: [{parts: [{text: userQuery}] }],
      systemInstruction: {
        parts: [{text: SYSTEM_PROMPT }]
      },
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    //call Google Gemini API
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GOOGLE_API_KEY;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google API error:", errText);
      return res.status(500).json({ error: "Failed to fetch from Google API" });
    }

    //Parse model output
    const data = await response.json();
    let modelResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    //Ensure it’s valid JSON
    let result;
    try {
      result = JSON.parse(modelResponse);
    } catch {
      result = {
        predicted_value: null,
        reasoning: modelResponse || "Model returned an unexpected response."
      };
    }

    //Send back clean result
    res.status(200).json({
      success: true,
      predicted_value: result.predicted_value,
      reasoning: result.reasoning
    });
  } catch (err){
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
  console.log(req.body);
});

const upload = multer({dest: "/uploads"});

app.post("/uploadProduct", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price, category, condition/*seller_id */ } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: "Image file missing" });
    }

    //get the seller ID
    const { data: { user } } = await supabase.auth.getUser();
    const seller_id = user.id;
    console.log(user.id);
    
    //Upload image to Supabase Storage
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${seller_id}_${Date.now()}.${fileExt}`;
    const fileBuffer = fs.readFileSync(file.path);
    const filePath = `${seller_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    // Delete temporary file
    fs.unlinkSync(file.path);

    if (uploadError) throw uploadError;

    // Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    console.log(imageUrl); //testing
    console.log(seller_id);

    //Insert into Supabase database
    const { error: insertError } = await supabase.from("ProductTable").insert([
      {
        title,
        description,
        price: parseFloat(price),
        category,
        image_url: imageUrl,
        seller_id,
        condition
      }
    ]);

    if (insertError) throw insertError;

    res.status(200).json({ success: true, message: "Product uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/search", async (req, res) => {
const query = req.query.query || "";
  try {
    const { data, error } = await supabase
      .from("ProductTable")
      .select("title, description, image_url, price, category, seller_id")
      .ilike("title", `%${query}%`);

    if (error) throw error;
    res.json(data);
   
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching search results" });
  }
//console.log(req.query);

})

app.listen(3000, () => console.log('\nServer running on http://localhost:3000'));
