import {Foo} from "./foo";
import {Editor} from "./editor";



function main() {
    let heightMap = new Array(100);
    for (let i = 0; i < 100; i++) heightMap[i] = 0;

    let editor = Editor(heightMap);
    editor.show();
}

main();