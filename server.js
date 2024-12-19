const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const DB_FILE = "db.json";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], catalog: [] }, null, 2));
}

const readDB = () => {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send("Все поля обязательны для заполнения.");
    }

    const db = readDB();
    const existingUser = db.users.find((user) => user.username === username || user.email === email);

    if (existingUser) {
        return res.status(400).send("Пользователь с таким именем или email уже существует.");
    }

    const newUser = {
        username,
        email,
        password,
        registrationDate: new Date().toISOString().split("T")[0], // Добавляем дату регистрации
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).send("Регистрация успешна.");
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const db = readDB();
    const user = db.users.find((u) => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).send("Неверное имя пользователя или пароль.");
    }

    res.status(200).json({ message: "Вход выполнен успешно.", user });
});

app.get("/user", (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).send("Имя пользователя не указано.");
    }

    const db = readDB();
    const user = db.users.find((u) => u.username === username);

    if (!user) {
        return res.status(404).send("Пользователь не найден.");
    }

    const userData = {
        username: user.username,
        email: user.email,
        registrationDate: user.registrationDate || "Не указано",
    };

    res.status(200).json(userData);
});

app.get("/catalog", (req, res) => {
    const db = readDB();
    res.status(200).json(db.catalog);
});

app.post("/catalog", (req, res) => {
    const { name, price, category } = req.body;

    if (!name || !price || !category) {
        return res.status(400).send("Все поля обязательны для заполнения.");
    }

    const db = readDB();
    const newItem = { id: db.catalog.length + 1, name, price, category };
    db.catalog.push(newItem);
    writeDB(db);

    res.status(201).send("Товар добавлен в каталог.");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/auth.html");
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
