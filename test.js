const AD = require("ad");

// Your AD account should be a member
// of the Administrators group.
const ad = new AD({
  url: "ldap://10.10.2.147",
  user: "admin_sjaphar@catmktg.com",
  pass: "Newyear@123"
});

let res = async () => {
  try {
    let loc = await ad.user("sjaphar@catmktg.com").location();
    let result = await ad.user("sjaphar").exists();
    if (result == true && loc == "TERMS") {
      console.log("terminated");
    } else {
      console.log("not terminated");
    }
    console.log(loc);
    console.log(result);
  } catch (err) {
    console.log(err);
  }
};
res();
