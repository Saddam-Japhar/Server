let bodyParser = require("body-parser");
const express = require("express");
const app = express();
var cors = require("cors");
let sql = require("mssql");
let mysql = require("mysql");
const SQL = require("sql-template-strings");
const pg = require("pg");
const Shell = require("node-powershell");

app.use(cors());
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);
app.use(bodyParser.json());
app.use(
  express.json({
    type: ["application/json", "text/plain"]
  })
);

//--------------------------------------Node Poweshell-----------------------------
const ps = new Shell({
  executionPolicy: "Bypass",
  noProfile: true
});
app.post("/computerOps/AccountCreation", (req, res, next) => {
  console.log(`the value receive is ${req.body.FirstName}`);
  let powers = async () => {
    ps.addCommand("./script.ps1");
    try {
      const result = await ps.invoke();
      // const userData = await res.json();
      console.log(result);
      return res.json({ data: result });
    } catch (err) {
      console.log(err);
    }
  };
  powers();
});
//--------------------------------Active directory------------------------------

const AD = require("ad");

// Your AD account should be a member
// of the Administrators group.
const ad = new AD({
  url: "ldap://10.10.2.147",
  user: "admin_sjaphar@catmktg.com",
  pass: "Newyear@123"
});

app.post("/computerOps/Activedirectory", (req, res, next) => {
  let resl = async () => {
    try {
      const result = await ad.user(req.body.term).get();
      console.log(result);
      return res.json({ data: result.groups });
    } catch (err) {
      console.log(err);
    }
  };
  resl();
});

//-----------------databse------------------------------------------
dbConfig = {
  server: "10.8.6.58",
  database: "camdb_test",
  user: "techops",
  password: "Techops@123",
  port: 1433
};
//------------------------ PG connectivity with frontEnd-----------------------------------
let pool = new pg.Pool({
  user: "u9a07damd317v5",
  host: "ec2-34-206-84-18.compute-1.amazonaws.com",
  database: "d7u92c4fntjp4",
  password: "pe8p0tuk8bm0q91ukdkvq9r4aat",
  port: 5432,
  ssl: true
});
app.post("/computerOps/search", (req, res, next) => {
  pool.connect((err, db, done) => {
    if (err) {
      done();
      console.log(err);
      return res.json();
    } else {
      if (req.body.term !== undefined) {
        console.log(`the value received is ${req.body.term}`);
        db.query(
          SQL`select * from user_t where net_id =${req.body.term}`,
          (err, result) => {
            done();
            if (err) {
              console.log(err);
            } else {
              return res.json({ data: result.rows });
              // console.log(result.rows);
            }
          }
        );
      } else {
        let val = req.body.value;
        console.log(`the value received is ${val}`);
        db.query(
          "select ce.cmpgn_nbr, c.cmpgn_typ, ce.cell_nbr, case when ce.state='eval_running' then 'RUNNING' when ce.state='eval_pending' then 'QUEUED' end as current_state, max(t.creation_tms) - interval '4 hours' as queued_tms from " +
            val +
            ".cell_t ce  join " +
            val +
            ".cell_transition_t ct on ce.cell_nbr=ct.cell_nbr join " +
            val +
            ".transition_t t on ct.transition_nbr=t.transition_nbr  join " +
            val +
            ".cmpgn_t c using (cmpgn_nbr) where ce.state in ('eval_running', 'eval_pending') and t.end_state=ce.state group by 1,2,3,4 order by 4,2,1; ",

          (err, result) => {
            done();
            if (err) {
              console.log(err);
            } else {
              return res.json({ data: result.rows });
              // console.log(result.rows);
            }
          }
        );
      }
    }
  });
});

// -------------------------------------Cell Evaluation---------------------------------
app.post("computerOps/", (req, res, next) => {
  pool.connect((err, db, done) => {
    let val = req.body.value;
    if (err) {
      done();
      console.log(err);
      return res.json();
    } else {
      console.log(`the value received is ${val}`);
      db.query(
        SQL`select * from user_t where net_id ="sjaphar"`,
        (err, result) => {
          done();
          if (err) {
            console.log(err);
          } else {
            return res.json({ data: result.rows });
            // console.log(result.rows);
          }
        }
      );
    }
  });
});

// ----------------------------------------------------------------------

app.post("/database/search", (req, res) => {
  let conn = new sql.ConnectionPool(dbConfig);

  let request = new sql.Request(conn);
  conn.connect(function(err) {
    if (err) {
      res.send(err);
      return;
    }
    console.log(`the value recieved is ${req.body.term}`);
    request.query(
      `SELECT * FROM sys.database_principals WHERE name = '${req.body.term}'`,
      function(err, results) {
        if (err) {
          res.send(err);
        } else {
          return res.json({
            data: results
          });
          console.log(data);
          console.table(data.recordset);
        }

        conn.close();
      }
    );
  });
});

app.post("/database/", urlencodedParser, (req, res) => {
  let conn = new sql.ConnectionPool(dbConfig);

  let request = new sql.Request(conn);
  console.log(req.body);
  console.log(req.body.name);
  let L = req.body.LogIn;
  let P = req.body.Password;
  let U = req.body.UserName;
  let D = req.body.Database;

  // let Values = { name: n, email: e };
  // let sq = "INSERT INTO Users SET ?";
  // console.log(Values[0]);
  console.log(`the received values are ${L} ,${P},${U},${D}`);
  conn.connect(function(err) {
    if (err) {
      res.send(err);
      return;
    }
    console.log(
      "INSERT INTO Users (name, email) VALUES ('" + L + "','" + P + "')"
    );
    // var parameters = [
    //   { name: "Uname", sqltype: sql.NVarChar, value: L },
    //   { name: "Uemail", sqltype: sql.NVarChar, value: U }
    // ];
    // parameters.forEach(function(p) {
    //   request.input(p.name, p.sqltype, p.value);
    // });
    // request.query(
    //   // "CREATE LOGIN [CATALINA\\sjaphar] FROM WINDOWS WITH DEFAULT_DATABASE=[CamDB_test]",
    request.query(
      "CREATE LOGIN " +
        L +
        " WITH PASSWORD=N'" +
        P +
        "' MUST_CHANGE, DEFAULT_DATABASE=[CamDB_test], CHECK_EXPIRATION=ON, CHECK_POLICY=ON; CREATE USER " +
        U +
        " FOR LOGIN " +
        L +
        "",
      function(err, results) {
        if (err) {
          res.send(err);
          console.log(err);
        } else {
          return res.json({
            data: results
          });
          // console.log(data)
          // console.table(data.recordset)
        }
        conn.close();
      }
    );
  });
});

app.listen(4000, () => {
  console.log("product server listning on 4000");
});
