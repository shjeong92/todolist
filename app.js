//jshint esversion:6
const mongoose = require("mongoose")
const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const uri = "mongodb+srv://sang-admin:Azonnet7328@cluster0.au4be.mongodb.net/todolistDB";
const url = 'mongodb://localhost:27017/todolistDB';
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected");
});
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res){

  const customListName =(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //When the route is newly created = > Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(function(err, result){
            console.log("foundlist.items.length ");
            res.redirect("/" + customListName);
        });

      }

      else {
        //Show an existing list
        if(foundList.items!=null && foundList.items.length !=0)
        {
          console.log("foundlist is not null"+foundList.items);
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

        }
        //When you delete all the items => update it to the default!
        if(foundList.items!=null && foundList.items.length === 0) {
            const list = new List({
              name: customListName,
              items: defaultItems
            });
            List.findOneAndUpdate({name: customListName}, {$push: {items: defaultItems}}, function(err, foundList){
              if (!err){
                console.log("deleted");
                res.redirect("/" + customListName);
              }

            });

          }
      }
    }
  });
});
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        console.log("deleted");
        res.redirect("/" + listName);
      }

    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server has started Successfully");
});
