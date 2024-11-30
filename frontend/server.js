const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname ,"public")));

// app.get("/", (req,res) => {
// });

app.listen("3000" , () => {
    console.log("Frontend Server ready at http://localhost:3000/html/mainPage.html");
    console.log(path.join(__dirname ,"public"));
});