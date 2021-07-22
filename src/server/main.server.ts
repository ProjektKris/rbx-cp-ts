import { RunTests, GetTests } from "shared/test";
export { }

const ServerScriptService = game.GetService("ServerScriptService")

print("Hello from server!");

const modules = ServerScriptService.FindFirstChild("tests")//?.GetChildren()

if (modules !== undefined) {
    RunTests(true, GetTests(modules))
}
