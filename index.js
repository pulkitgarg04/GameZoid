const express = require("express");
const PORT = 8080;
const app = express();

app.use(express.static("src"));

app.listen(PORT, () => {
    console.log(`Server is running on the port: ${PORT}`);
});