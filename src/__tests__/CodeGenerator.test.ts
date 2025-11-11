import {CodeGenerator} from "../CodeGenerator";

describe("Code Generator", () => {
    test("Contains Capital Letters", () => {
        var generator: CodeGenerator = new CodeGenerator(10);
        for (var j = 0; j < 10; j++) {
            var code: string = generator.generateCode();

            for (var i = 0; i < code.length; i++) {
                expect(code.charCodeAt(i)).toBeGreaterThan(64)
                expect(code.charCodeAt(i)).toBeLessThan(91)
            }
        }
    });
});