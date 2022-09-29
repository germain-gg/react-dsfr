import { capitalize } from "tsafe/capitalize";
import { id } from "tsafe/id";
import css from "css";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";
import { multiReplace } from "../tools/multiReplace";
import * as crypto from "crypto";

export type ColorScheme = "light" | "dark";
export const data_fr_theme = "data-fr-theme";

// https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-identite-de-l-etat/couleurs-palette

export type Variant = "main" | "sun" | "moon";

export const states = ["hover", "active"] as const;
export type State = typeof states[number];

export type BrightnessIndex = {
    value: number;
    variant: Variant | undefined;
};

export type ParsedColorOptionName =
    | ParsedColorOptionName.Invariant
    | ParsedColorOptionName.Variadic;

export declare namespace ParsedColorOptionName {
    type Common = {
        colorName: string;
        state: State | undefined;
    };

    /** Same value in dark and light mode */
    export type Invariant = Common & {
        brightness: {
            isInvariant: true;
        } & BrightnessIndex;
    };

    /** The color varies depending of the color scheme */
    export type Variadic = Common & {
        brightness: {
            isInvariant: false;
        } & Record<ColorScheme, BrightnessIndex>;
    };
}

export function parseColorOptionName(colorOptionName: `--${string}`): ParsedColorOptionName {
    const parsedColorOptionName: ParsedColorOptionName.Variadic = {
        "colorName": "",
        "brightness": {
            "isInvariant": false,
            "light": {
                "value": NaN,
                "variant": undefined
            },
            "dark": {
                "value": NaN,
                "variant": undefined
            }
        },
        "state": undefined
    };

    const getReturnValue = (): ParsedColorOptionName =>
        isNaN(parsedColorOptionName.brightness.dark.value)
            ? id<ParsedColorOptionName.Invariant>({
                  "colorName": parsedColorOptionName.colorName,
                  "brightness": {
                      "isInvariant": true,
                      ...parsedColorOptionName.brightness.light
                  },
                  "state": parsedColorOptionName.state
              })
            : parsedColorOptionName;

    /*
	--name1-name2-111
	--name1-name2-111-hover
	--name1-name2-sun-111
	--name1-name2-sun-111-hover
	--name1-name2-111-222
	--name1-name2-111-222-hover
	--name1-name2-sun-111-222
	--name1-name2-sun-111-222-hover
	--name1-name2-111-moon-222
	--name1-name2-111-moon-222-hover
	--name1-name2-sun-111-moon-222
	--name1-name2-sun-111-moon-222-hover
	*/

    let revArr = colorOptionName.replace(/^--/, "").split("-").reverse();

    /*
	revArr=
	["111","name2","name1"]
	["hover","111","name2","name1"]
	["111","sun","name2","name1"]
	["hover","111","sun","name2","name1"]
	["222","111","name2","name1"]
	["hover","222","111","name2","name1"]
	["222","111","sun","name2","name1"]
	["hover","222","111","sun","name2","name1"]
	["222","moon","111","name2","name1"]
	["hover","222","moon","111","name2","name1"]
	["222","moon","111","sun","name2","name1"]
	["hover","222","moon","111","sun","name2","name1"]
	*/

    parse_state: {
        const [word, ...rest] = revArr;

        if (word !== "hover" && word !== "active") {
            break parse_state;
        }

        revArr = rest;

        parsedColorOptionName.state = word;
    }

    /*
	revArr=
	["111","name2","name1"]
	["111","sun","name2","name1"]
	["222","111","name2","name1"]
	["222","111","sun","name2","name1"]
	["222","moon","111","name2","name1"]
	["222","moon","111","sun","name2","name1"]
	*/

    let brightnessIndex: number;

    {
        const [word, ...rest] = revArr;

        revArr = rest;

        brightnessIndex = parseInt(word);
    }

    /*
	revArr=
	["name2","name1"]
	["sun","name2","name1"]
	["111","name2","name1"]
	["111","sun","name2","name1"]
	["moon","111","name2","name1"]
	["moon","111","sun","name2","name1"]
	*/

    {
        const [word, ...rest] = revArr;

        revArr = rest;

        const n = parseInt(word);

        if (!isNaN(n)) {
            /*
			revArr=
			["name2","name1"]
			["sun","name2","name1"]
			*/

            parsedColorOptionName.brightness.dark.value = brightnessIndex;
            parsedColorOptionName.brightness.light.value = n;

            {
                const [word, ...rest] = revArr;

                revArr = rest;

                if (word === "main" || word === "sun" || word === "moon") {
                    /*
					revArr=
					["name2","name1"]
					*/

                    parsedColorOptionName.brightness.light.variant = word;

                    parsedColorOptionName.colorName = rest
                        .reverse()
                        .map((word, i) => (i === 0 ? word : capitalize(word)))
                        .join("");

                    return getReturnValue();
                }

                /*
				revArr=
				["name1"]
				*/

                parsedColorOptionName.colorName = [...rest.reverse(), word]
                    .map((word, i) => (i === 0 ? word : capitalize(word)))
                    .join("");

                return getReturnValue();
            }
        }

        if (word === "main" || word === "sun" || word === "moon") {
            /*
			revArr=
			["name2","name1"]
			["111","name2","name1"]
			["111","sun","name2","name1"]
			*/

            const variant: Variant = word;

            {
                const [word, ...rest] = revArr;

                revArr = rest;

                const n = parseInt(word);

                if (!isNaN(n)) {
                    /*
					revArr=
					["name2","name1"]
					["sun","name2","name1"]
					*/

                    parsedColorOptionName.brightness.dark.value = brightnessIndex;
                    parsedColorOptionName.brightness.dark.variant = variant;
                    parsedColorOptionName.brightness.light.value = n;

                    {
                        const [word, ...rest] = revArr;

                        revArr = rest;

                        if (word === "main" || word === "sun" || word === "moon") {
                            /*
							revArr=
							["name2","name1"]
							*/

                            parsedColorOptionName.brightness.light.variant = word;

                            parsedColorOptionName.colorName = rest
                                .reverse()
                                .map((word, i) => (i === 0 ? word : capitalize(word)))
                                .join("");

                            return getReturnValue();
                        }

                        /*
						revArr=
						["name1"]
						*/

                        parsedColorOptionName.colorName = [...rest.reverse(), word]
                            .map((word, i) => (i === 0 ? word : capitalize(word)))
                            .join("");

                        return getReturnValue();
                    }
                }

                /*
				revArr=
				["name1"]
				*/

                parsedColorOptionName.brightness.light.variant = variant;
                parsedColorOptionName.brightness.light.value = brightnessIndex;

                parsedColorOptionName.colorName = [...rest.reverse(), word]
                    .map((word, i) => (i === 0 ? word : capitalize(word)))
                    .join("");

                return getReturnValue();
            }
        }

        /*
		revArr=
		["name1"]
		*/

        parsedColorOptionName.brightness.light.value = brightnessIndex;

        parsedColorOptionName.colorName = [...rest.reverse(), word]
            .map((word, i) => (i === 0 ? word : capitalize(word)))
            .join("");

        return getReturnValue();
    }
}

/**
 * Exported only for tests
 *
 * getThemePath(parseColorOptionName("--pink-macaron-sun-406-moon-833-hover"))
 * ->
 * ["pinkMacaron", "_sun_406_moon_833", "hover"]
 */
export function getThemePath(parsedColorOptionName: ParsedColorOptionName): string[] {
    const o = parsedColorOptionName;

    return [
        o.colorName,
        o.brightness.isInvariant
            ? `${o.brightness.variant ?? "_"}${o.brightness.value}`
            : `${o.brightness.light.variant ?? "_"}${o.brightness.light.value}${
                  o.brightness.dark.variant ?? "_"
              }${o.brightness.dark.value}`,
        o.state ?? "default"
    ];
}

export type ColorOption = {
    colorOptionName: `--${string}`;
    themePath: string[];
    color:
        | string
        | {
              light: `#${string}`;
              dark: `#${string}`;
          };
};

export function parseColorOptions(rawCssCode: string): ColorOption[] {
    const parsedCss = css.parse(rawCssCode);

    const { declarations } = (() => {
        const node = parsedCss.stylesheet?.rules.find(
            rule => rule.type === "rule" && (rule as any)?.selectors?.[0] === ":root"
        );

        assert(node !== undefined);

        const { declarations } = node as any;

        return { declarations };
    })();

    const { declarationsDark } = (() => {
        const node = parsedCss.stylesheet?.rules.find(
            rule =>
                rule.type === "rule" &&
                (rule as any)?.selectors?.[0] === `:root:where([${data_fr_theme}="dark"])`
        );

        assert(node !== undefined);

        const { declarations: declarationsDark } = node as any;

        return { declarationsDark };
    })();

    return declarations
        .map(({ property: colorName, value: color }: any) => {
            const htmlColorRegexp = /^#[0-9a-f]{3,6}$/;

            if (!htmlColorRegexp.test(color)) {
                return undefined;
            }

            const parsedName = parseColorOptionName(colorName);

            const colorDark = declarationsDark.find(
                ({ property }: any) => property === colorName
            )?.value;

            assert(typeof colorDark === "string");
            assert(htmlColorRegexp.test(colorDark), `${colorDark} doesn't seem to be a color`);

            if (parsedName.brightness.isInvariant) {
                assert(color === colorDark);
            }

            return {
                "colorOptionName": colorName,
                "themePath": getThemePath(parsedName),
                "color": parsedName.brightness.isInvariant
                    ? color
                    : {
                          "light": color,
                          "dark": colorDark
                      }
            };
        })
        .filter(exclude(undefined));
}

export function generateGetColorOptionsTsCode(colorOptions: ColorOption[]) {
    const obj: any = {};

    const keyValues: Record<string, string> = {};

    colorOptions.forEach(colorOption => {
        const value = (() => {
            if (typeof colorOption.color === "string") {
                return colorOption.color;
            }

            const hash = crypto
                .createHash("sha256")
                .update(colorOption.themePath.join(""))
                .digest("hex");

            keyValues[
                `"${hash}"`
            ] = `isDark ? "${colorOption.color.dark}" : "${colorOption.color.light}"`;

            return hash;
        })();

        function req(obj: any, path: string[]): void {
            const [propertyName, ...pathRest] = path;

            if (pathRest.length === 0) {
                obj[propertyName] = value;
                return;
            }

            if (obj[propertyName] === undefined) {
                obj[propertyName] = {};
            }

            req(obj[propertyName], pathRest);
        }

        req(obj, colorOption.themePath);
    });

    return [
        `export function getColorOptions(colorScheme: ColorScheme) {`,
        `    const isDark: boolean = (() => {`,
        `        switch (colorScheme) {`,
        `            case "dark": return true;`,
        `            case "light": return false;`,
        `        }`,
        `    })();`,
        ``,
        `    return {`,
        multiReplace({
            "input": JSON.stringify(obj, null, 2),
            keyValues
        })
            .replace(/^{\n/, "")
            .replace(/\n}$/, "")
            .split("\n")
            .map(line => line.replace(/^[ ]{2}/, ""))
            .map(line => `        ${line}`)
            .join("\n"),
        `    } as const;`,
        `}`
    ].join("\n");
}
