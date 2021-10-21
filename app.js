
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static("public"));	
//
//mongodb+srv://admin-abyl:test@cluster0.kzs6m.mongodb.net/todolistDB
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = { name: String };
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({name : "Welcome to To-Do List"});
const item2 = new Item ({name : "Hit the + button to add a new item" });
const item3 = new Item ({name : "<-- Hit this to delete an item"}); 

const listSchema = {name: String, items: [itemsSchema]};
const defaultItems = [item1, item2, item3];
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
	Item.find({}, function(error, foundItems){
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, function(error) {
				if (error) {
					console.log(error);
				} else {
					console.log("Success!");
				}
			});
			res.redirect('/');
		} else {
			let day = date.getDate();
			res.render("list", {listTitle: "Today", newListItems: foundItems});
		}
	});	
});
	
app.get("/:customListName", function(req, res){
  	const customListName = _.capitalize(req.params.customListName);
  	List.findOne({name: customListName}, function(error, foundList){
	    if (!error){
	      	if (!foundList){
	        	const list = new List({ name: customListName, items: defaultItems});
	        	list.save();
	        	res.redirect("/" + customListName);
	      	} else {
	        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
	     	}
	    }
	});
});

app.post("/", function(req, res){
  	const itemName = req.body.newItem;
  	const listName = req.body.list;
  	const item = new Item({ name: itemName });
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
    	Item.findByIdAndRemove(checkedItemId, function(error){
	      	if (!error) {
	        	console.log("Successfully deleted!");
	        	res.redirect("/");
	      	}
    	});
  	} else {
    	List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(error, foundList){
	      	if (!error){
	        	res.redirect("/" + listName);
      		}
    	});
  	}
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == ""){
	port = 3000;
}

app.listen(port, function(){
	console.log("The server is running on port: " + port);
});
