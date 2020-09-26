//jshint esversion:6


const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _= require('lodash');

const app = express();

app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));


mongoose.connect("mongodb+srv://admin-imran:Test123@cluster0.g4lox.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete item"
});

const defaultItems = [item1, item2, item3];


const listSchema = ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);



// ---------------------

app.get("/", function(req, res) {

  Item.find({}, function(err, doc) {

    if (doc.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved dafault items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render('list', { listTitle: "Today", newListItem: doc });
    }
  });

});

// ------------------------

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function (err, result) {
    if (!err) {
      if (!result) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        //showing an existing list
        res.render('list', { listTitle: result.name, newListItem: result.items });
      }
    }
  });

});

// ------------------------

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }

});
// -----------------------


app.post('/delete', function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.hidden;

  if( listTitle === 'Today' ){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/')
      }
    });
  } else {
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedItemId}}} , function (err, foundList) {
      if (!err) {
        res.redirect('/' + listTitle);
      }
    });
  }

});




app.listen(3000, function() {
  console.log("Server running at port 3000.");
});
