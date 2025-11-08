import {CodeGenerator} from "../CodeGenerator";

describe("Code Generator", () => {
    test("Unique codes", () => {
        var generator: CodeGenerator = new CodeGenerator(4);
        var codes: string[] = [];
        for (var i = 0; i < 4; i++) {
            var code: string = generator.generateCode();
            codes.push(code);
        }

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 3; j++) {
                for (var k = j + 1; k < 4; k++) {
                    expect((codes[j] as string).charAt(i)).not.toBe((codes[k] as string).charAt(i));
                }
            }
        }

        console.log(`Test codes: ${codes[0]}, ${codes[1]}, ${codes[2]}, ${codes[3]}`)
    });

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