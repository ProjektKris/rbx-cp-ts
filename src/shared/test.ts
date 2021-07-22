export function GetTests(i: Instance): ModuleScript[] {
    let testCodes: ModuleScript[] = [];
    testCodes.forEach((instance: Instance, index: number) => {
        if (instance.IsA("ModuleScript")) {
            if (string.find(instance.Name, ".test")) {
                testCodes[index + 1] = instance
            }
        }
    });
    return testCodes
}

export function RunTests(p: boolean, modules: ModuleScript[]) {
    assert(p !== undefined, "Missing argument #1 to test.Run")
    assert(modules, "Missing argument #2 to test.Run")

    let passedCount: number = 0;
    let failedCount: number = 0;

    for (const module of modules) {
        print("Testing " + module.GetFullName())
        let f: any = require(module)
        if (p) {
            let res: LuaTuple<[false, string] | [true, unknown]> = pcall(f)

            if (res[0]) {
                print("\tPassed")
                passedCount++;
            } else {
                warn("\tFailed: " + res[1])
                failedCount++;
            }
        }
    }
}