import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let countries = [];
app.get("/", (req, res) => {
  countries = [];
  const client = new pg.Client({
    user: "postgres",
    password: "Jalapeno.70",
    host: "localhost",
    port: 5432,
    database: "world",
  });
  client.connect();
  client.query("SELECT country_code FROM visited_countries", (err, result) => {
    if (err) {
      console.error("Error executing query", err.stack);
    } else {
      result.rows.forEach((record) => {
        countries.push(record.country_code);
      });
      res.render("index.ejs", {
        countries,
        total: countries.length,
      });
    }
    client.end();
  });
});

app.post("/add", async (req, res) => {
  const country = req.body.country;
  const client = new pg.Client({
    user: "postgres",
    password: "Jalapeno.70",
    host: "localhost",
    port: 5432,
    database: "world",
  });
  try {
    client.connect();
    const records = await client.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [country.toLowerCase()]
    );
    const country_code = records.rows[0].country_code;
    try {
      await client.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [country_code]
      );
      res.redirect("/");
    } catch (err) {
      console.error("Failed executing query", err.stack);
      res.render("index.ejs", {
        error: "Country has already been added, try again",
        countries,
        total: countries.length,
      });
    }
  } catch (err) {
    console.error("Failed executing query", err.stack);
    res.render("index.ejs", {
      error: "Country name does not exist, try again",
      countries,
      total: countries.length,
    });
  }
  client.end();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
