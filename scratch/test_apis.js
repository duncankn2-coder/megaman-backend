async function run() {
  try {
    console.log("Fetching home page global...");
    const res = await fetch("http://localhost:3000/api/globals/home-page");
    console.log("Status:", res.status);
    const text = await res.text();
    if (!res.ok) {
      console.log("Error HTML:", text.slice(0, 1000));
    } else {
      const json = JSON.parse(text);
      console.log("Response:", JSON.stringify(json, null, 2).slice(0, 500));
    }
  } catch (err) {
    console.error("Error fetching backend:", err);
  }
}
run();
