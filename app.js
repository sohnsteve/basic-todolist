const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

  // local db connection:
// mongoose.connect(
//   'mongodb://localhost:27017/todolistDB',
//   {useNewUrlParser: true, useUnifiedTopology: true}
// );

  // cloud db connection:
mongoose.connect(
  process.env.DB_TODOLIST_URL,
  {useNewUrlParser: true, useUnifiedTopology: true}
);

// due to deprecation warning when using findOneAndUpdate() during a deletion
mongoose.set('useFindAndModify', false);

const itemSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
  name: "This is your todo list"
});

const item2 = new Item ({
  name: "Add items with the + button"
});

const item3 = new Item ({
  name: "Cross off items as you complete them"
});

const item4 = new Item ({
  name: "And delete them using the delete button"
});

const defaultItems = [item1, item2, item3, item4];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Entered default items");
        }
        res.redirect('/');
      });
    } else {
      res.render('list', {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', function(req, res){
  const deleteItems = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteMany({_id: deleteItems}, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted item(s)");
      }
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: {$in:deleteItems}}}},
      function(err, foundList) {
        if (err) {
          console.log(err);
        } else {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

app.get('/:customListName', function(req, res){
  const listName = _.capitalize(req.params.customListName);

  // check to see if list with that name already exists
  List.findOne({name: listName}, function(err, foundList){
    if (err) {
      console.log(err);
    } else {
      if (foundList) {
        // existing list found, show list
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
      } else {
        // create list that didn't exist
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + listName);
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port " + port);
});

