# Development demo. Overwrites the explicitly listed positions. Use an empty test area only.
setblock ~-1 ~1 ~1 minecraft:glass
setblock ~1 ~1 ~1 minecraft:glass
setblock ~ ~1 ~2 minecraft:glass
setblock ~-1 ~2 ~1 minecraft:glass
setblock ~1 ~2 ~1 minecraft:glass
setblock ~ ~2 ~2 minecraft:glass
setblock ~ ~2 ~ minecraft:glass
setblock ~-1 ~3 ~1 minecraft:glass
setblock ~1 ~3 ~1 minecraft:glass
setblock ~ ~3 ~2 minecraft:glass
setblock ~ ~3 ~ minecraft:glass
setblock ~ ~ ~1 minecraft:stone
setblock ~ ~1 ~ bedrockworks:water_wheel ["bedrockworks:axis"="x"]
setblock ~1 ~1 ~ bedrockworks:shaft ["bedrockworks:axis"="x"]
setblock ~2 ~1 ~ bedrockworks:shaft ["bedrockworks:axis"="x"]
setblock ~3 ~1 ~ bedrockworks:large_gear ["bedrockworks:axis"="x"]
setblock ~3 ~2 ~1 bedrockworks:gear ["bedrockworks:axis"="x"]
setblock ~4 ~2 ~1 bedrockworks:shaft ["bedrockworks:axis"="x"]
setblock ~5 ~2 ~1 bedrockworks:speed_meter ["bedrockworks:axis"="x"]
setblock ~6 ~2 ~1 bedrockworks:stress_meter ["bedrockworks:axis"="x", "bedrockworks:brake"=8]
setblock ~7 ~2 ~1 bedrockworks:gearbox ["bedrockworks:axis"="y"]
setblock ~7 ~2 ~2 bedrockworks:shaft ["bedrockworks:axis"="z"]
setblock ~7 ~2 ~3 bedrockworks:speed_meter ["bedrockworks:axis"="z"]
setblock ~ ~1 ~1 minecraft:air
setblock ~ ~2 ~1 minecraft:air
setblock ~ ~3 ~1 minecraft:water ["liquid_depth"=0]
