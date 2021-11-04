// Enquirer engine.
const { prompt } = require("enquirer");

// Migration Helpers
const { v4 } = require("../../lib");
const { migratePlugin, migrateApiFolder, migrateDependencies } =
  v4.migrationHelpers;

// Prompt's configuration
const promptOptions = [
  {
    type: "select",
    name: "type",
    message: "What do you want to migrate?",
    choices: [
      { name: "Project", value: "project" },
      { name: "Only Dependencies", value: "dependencies" },
      { name: "Plugin", value: "plugin" },
    ],
    result() {
      return this.focused.value;
    },
  },
  {
    type: "input",
    name: "path",
    message: ({ answers }) => {
      return answers.type === "plugin"
        ? "Enter the path to your Strapi plugin"
        : "Enter the path to your Strapi application";
    },
    initial: "./",
  },
];

const pluginPromptOptions = (pathToV3) => {
  return [
    {
      type: "input",
      name: "pathForV4",
      message: "Where would you like to create your v4 plugin?",
      initial: `${pathToV3}-v4`,
    },
  ];
};

const migrateWithFlags = async (options) => {
  if (options.project) {
    await migrateApiFolder(options.project);
    await migrateDependencies(options.project);
  }
  if (options.dependencies) {
    await migrateDependencies(options.dependencies);
  }
  if (options.plugin) {
    const pathForV4Plugin = `${options.plugin}-v4`;
    await migratePlugin(options.plugin, pathForV4Plugin);
  }
};

// `strapi-codemods migrate`
const migrate = async (options) => {
  try {
    // Use bypass in order to migrate & don't have the prompt
    if (
      options &&
      (options.project || options.dependencies || options.plugin)
    ) {
      await migrateWithFlags(options);
      process.exit(0);
    }

    const response = await prompt(promptOptions);

    switch (response.type) {
      case "project":
        await migrateApiFolder(response.path);
        await migrateDependencies(response.path);
        break;
      case "dependencies":
        await migrateDependencies(response.path);
        break;
      case "plugin":
        const pluginResponse = await prompt(pluginPromptOptions(response.path));
        console.log(pluginResponse);
        const pathForV4Plugin = `${response.path}-v4`;
        await migratePlugin(response.path, pluginResponse.pathForV4);
        break;
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = migrate;
