const express = require('express');
const path = require('path');

const app = express();

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "html", "mainPage.html"));
});

app.get("/createPage", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "html", "createPage.html"));
});

app.get("/joinPage", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "html", "joinPage.html"));
});

app.get("/loginPage", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "html", "loginPage.html"));
});

app.get("/registerPage", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "html", "registerPage.html"));
});

app.listen("3000" , () => {
    console.log("Frontend Server ready at http://localhost:3000");
    //console.log(path.join(__dirname ,"public"));
});