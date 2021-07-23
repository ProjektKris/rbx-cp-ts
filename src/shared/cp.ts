// services
// import { CollectionService, Players, Teams, RunService } from "@rbxts/services";
// const forin = require(script.Parent.forin)
import { forin } from "./forin"
const CollectionService: CollectionService = game.GetService("CollectionService")
const Players: Players = game.GetService("Players")
const Teams: Teams = game.GetService("Teams")
const RunService: RunService = game.GetService("RunService")

export type TeamCapturerCount = { [teamName: string]: number }
export type TeamProgress = { [teamName: string]: number }

function buildHitbox(parent: Instance, size: Vector3, position: Vector3, shape: Enum.PartType): BasePart {
	assert(size, "Missing argument #1 to cp:BuildHitbox")

	let newHitbox: Part = new Instance("Part")
	newHitbox.Anchored = true
	newHitbox.CanCollide = false
	newHitbox.Shape = shape
	newHitbox.Size = size
	newHitbox.Position = position
	newHitbox.Orientation = new Vector3(0, 0, 90)
	newHitbox.Parent = parent

	return newHitbox
}

export class CP {
	CaptureDuration: number
	PlayerTag: string

	Initialized: boolean = false;
	HitboxPart: BasePart
	PartsInZone: number[] = []
	CapturerInZone: TeamCapturerCount = {}
	Owner: Instance | Team | undefined = undefined
	Progress: TeamProgress = {}

	_Connections: RBXScriptConnection[] = []
	Events: {
		ProgressUpdated: BindableEvent,
		Captured: BindableEvent,
	} = {
			ProgressUpdated: new Instance("BindableEvent"),
			Captured: new Instance("BindableEvent")
		}

	constructor(
		parent: Instance,
		size: Vector3,
		position: Vector3,
		shape: Enum.PartType,
		captureDuration: number,
		playerTag: string
	) {
		this.CaptureDuration = captureDuration;
		this.PlayerTag = playerTag;

		this.HitboxPart = buildHitbox(parent, size, position, shape);

		for (const team of Teams.GetChildren()) {
			this.Progress[team.Name] = 0
		}
	}

	Init(getPlayerFromPart: (part: BasePart) => Player | undefined) {
		assert(this.Initialized === false, "Attempted to initialize an initialized cp")
		assert(this.HitboxPart, "Property HitboxPart missing")

		getPlayerFromPart = getPlayerFromPart !== undefined ? getPlayerFromPart : (part: BasePart): Player | undefined => {
			return Players.GetPlayerFromCharacter(part.Parent)
		}

		this._Connections[0] = this.HitboxPart.Touched.Connect((part: BasePart) => {
			if (CollectionService.HasTag(part, this.PlayerTag)) {
				const player: Player | undefined = getPlayerFromPart(part)
				if (player) {
					const userId: number = player.UserId;

					if (this.PartsInZone[userId] === undefined) {
						this.PartsInZone[userId] = 0;
					}

					this.PartsInZone[userId] += 1;

					this.CapturerInZone = this.GetAllTeamCapturerCount();
				}
			}
		})

		this._Connections[1] = this.HitboxPart.TouchEnded.Connect((part: BasePart) => {
			const player: Player | undefined = getPlayerFromPart(part)
			if (player) {
				const userId: number = player.UserId;

				if (this.PartsInZone[userId]) {
					if (this.PartsInZone[userId] <= 1) {
						delete this.PartsInZone[userId]// = undefined
					} else {
						this.PartsInZone[userId] -= 1
					}
					this.CapturerInZone = this.GetAllTeamCapturerCount()
				}
			}
		})

		this._Connections[2] = RunService.Heartbeat.Connect((dt: number) => {
			// capture progress
			const winningTeam: void | Instance | Team | undefined = this.GetTeamWithMostCapturer()
			if (winningTeam && winningTeam !== this.Owner) {
				if (this.Progress[winningTeam.Name] < 1) {
					const playerCount: number = this.CapturerInZone[winningTeam.Name] ? this.CapturerInZone[winningTeam.Name] : 1
					const speed: number = 1 / this.CaptureDuration * playerCount
					this.Progress[winningTeam.Name] = math.clamp(this.Progress[winningTeam.Name] + (speed * dt), 0, 1)
					this.Events.ProgressUpdated.Fire(this.Progress)
				} else {
					this.Owner = winningTeam
					this.Progress[winningTeam.Name] = 0
					this.Events.Captured.Fire(winningTeam)
				}
			} else {
				let updated: boolean = false
				forin(this.Progress, (teamName: string, progress: number) => {
					if (progress > 0) {
						const speed: number = 1 / this.CaptureDuration
						if (winningTeam) {
							if (teamName !== winningTeam.Name) {
								this.Progress[teamName] = math.clamp(progress - (speed * dt), 0, 1)
								updated = true
							}
						} else {
							this.Progress[teamName] = math.clamp(progress - (speed * dt), 0, 1)
							updated = true
						}
					}
				})
				if (updated) {
					this.Events.ProgressUpdated.Fire(this.Progress)
				}
			}
		})
		this.Initialized = true
	}

	GetTeamCapturerCount(team: Team): number {
		let count: number = 0;
		forin(this.PartsInZone, (userId: number, partCount: number) => {
			if (partCount) {
				if (partCount > 0) {
					const player: Player | undefined = Players.GetPlayerByUserId(userId - 1);
					if (player) {
						if (player.Team === team) {
							count += 1
						}
					}
				}
			}
		})
		return count
	}

	GetAllTeamCapturerCount(): TeamCapturerCount {
		let result: TeamCapturerCount = {}
		for (const team of Teams.GetChildren()) {
			if (team.IsA("Team")) {
				result[team.Name] = this.GetTeamCapturerCount(team);
			}
		}
		return result;
	}

	GetTeamWithMostCapturer(): Team | Instance | undefined | void {
		/*
			Returns nil if draw, if winning team is found it will return a 'Team' instance
		*/
		let highestKey: string | undefined = undefined;
		let highestCount: number = 0;

		forin(this.CapturerInZone, (teamName: string, count: number) => {
			if (count > highestCount) {
				highestCount = count
				highestKey = teamName
			} else if (count === highestCount) {
				highestKey = undefined;
			}
		})

		if (highestKey !== undefined) {
			const winningTeam: Team | Instance | undefined = Teams.FindFirstChild(highestKey)//[highestKey];
			return winningTeam
		}
	}

	Destroy() {
		for (const connection of this._Connections) {
			connection.Disconnect();
		}
		this.HitboxPart.Destroy();
	}
}