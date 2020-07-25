console.log(1111);

const river = new River();
river.ipt_Result.touch();
river.btn_Hello.onValue(() => river.ipt_Result.push("Hello"));
river.btn_Goodbye.onValue(() => river.ipt_Result.push("Goodbye"));

river.ul_Numbers.push(["one", "two", "three"]);
river.selection_ul_Numbers.onValue((v) => river.ipt_Result.push(v));

console.log(2222);

const renderEngine = new RenderEngine();
renderEngine.parentQuery("#gui");
renderEngine.render(river);

console.log(3333);
