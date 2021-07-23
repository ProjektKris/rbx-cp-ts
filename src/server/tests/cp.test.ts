import { CP, TeamProgress } from "shared/cp"
import { forin } from "shared/forin"
export function Run() {
    const Players = game.GetService("Players")
    const CollectionService = game.GetService("CollectionService")
    const Teams = game.GetService("Teams")

    const parent = game.GetService("Workspace")
    const size = new Vector3(1, 10, 10)
    const pos = new Vector3(0, 0.5, 0)
    const shape = Enum.PartType.Cylinder
    const capDuration = 10
    const playerTag = "PlayerPart"

    const createTeam = (teamName: string, teamColor: BrickColor): Team => {
        const newTeam: Team = new Instance("Team")
        newTeam.Name = teamName
        newTeam.TeamColor = teamColor
        newTeam.Parent = Teams
        return newTeam
    }

    createTeam("A", BrickColor.Blue())
    createTeam("B", BrickColor.Red())

    const newCP: CP = new CP(parent, size, pos, shape, capDuration, playerTag)
    newCP.Init((part: BasePart): Player | undefined => {
        return Players.GetPlayerFromCharacter(part.Parent)
    })

    assert(newCP.HitboxPart.Parent === parent, ("Expected CP hitbox parent at %s").format(tostring(parent)))
    assert(newCP.HitboxPart.Size === size, ("Expected CP hitbox size at %s").format(tostring(size)))
    assert(newCP.HitboxPart.Position === pos, ("Expected CP hitbox position at %s").format(tostring(pos)))

    newCP.Events.ProgressUpdated.Event.Connect((progress: TeamProgress) => {
        let s: string = ""
        forin(progress, (teamName: string, p: number) => {
            s += string.format("%s: %f\n", teamName, p)
        })
        print(s)
    })

    newCP.Events.Captured.Event.Connect((team: Team) => {
        print(("Team '%s' captured point %s").format(team.Name, tostring(newCP)))
    })

    // player character tagging
    let charAddedEvents: RBXScriptConnection[] = []
    Players.PlayerAdded.Connect((plr) => {
        charAddedEvents[plr.UserId] = plr.CharacterAdded.Connect(() => {
            const char = plr.Character
            if (char) {
                for (const instance of char?.GetChildren()) {
                    if (instance.IsA("BasePart")) {
                        CollectionService.AddTag(instance, playerTag)
                    }
                }
            }
        })
    })

    Players.PlayerRemoving.Connect((plr: Player) => {
        // cleanup
        if (charAddedEvents[plr.UserId]) {
            charAddedEvents[plr.UserId].Disconnect()
        }
    })
}
