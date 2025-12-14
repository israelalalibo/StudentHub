import  supabase2 from './config/supabaseClientFrontEnd.js'

const form = document.getElementById("productForm");
const successMsg = document.getElementById("successMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form); // handles file + text inputs automatically
  //const { data: { user } } = await supabase2.auth.getUser()
 // console.log(JSON.parse(user.id));
  //formData.append("seller_id", user.user.id);

  
  //console.log(JSON.stringify(formData));

  try {
    const response = await fetch("/uploadProduct", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      successMsg.textContent = "✅ Product listed successfully!";
      successMsg.classList.add("show");
      form.reset();
      
      // Trigger profile refresh if profile page is open
      localStorage.setItem('profileNeedsRefresh', Date.now().toString());
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('profileNeedsRefresh'));
      if (window.refreshProfileData) {
        window.refreshProfileData();
      }
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (error) {
    console.error("Upload failed:", error);
    alert("An error occurred while uploading the product.");
  }
});
