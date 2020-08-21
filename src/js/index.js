console.log(1111);

const river = new River();

function add () {
	const oldList = river.ul_TodoList.value();
	oldList.push("<h1>[ ] newTodoItem</h1>");
	river.ul_TodoList.push(oldList);
}

river.btn_Add.onValue(add);

river.ul_TodoList.push(["one", "two", "three"]);
river.selection_ul_TodoList.onValue((v) => alert(v));


console.log(2222);

const renderEngine = new RenderEngine();
renderEngine.parentQuery("#gui");
renderEngine.render(river);

console.log(3333);
