/**
 * @name Easymotes
 * @authorLink https://github.com/onurcagan
 * @source https://github.com/onurcagan/BetterDiscordPlugins/blob/master/Easymotes.plugin.js
 */

module.exports = (() => {
  const config = {
    info: {
      name: 'Easymotes',
      authors: [
        {
          name: 'Resuspott',
          discord_id: '198931193553485824',
          github_username: 'onurcagan',
        },
      ],
      version: '1.0.0',
      description: "Link emotes in chat for your friends that don't have BBD.",
      github: 'https://github.com/onurcagan/BetterDiscordPlugins/blob/master/Easymotes.plugin.js',
      github_raw: 'https://raw.githubusercontent.com/onurcagan/BetterDiscordPlugins/master/Easymotes.plugin.js',
    },
    defaultConfig: [
      {
        type: 'category',
        id: 'preferences',
        name: 'Preferences',
        collapsible: true,
        shown: true,
        settings: [
          {
            type: 'textbox',
            id: 'prefix',
            name: 'Prefix',
            value: '',
            note:
              'E.g. For "<" as the prefix <Kappa will work as intended. Can be left empty. Suggestion; x or . for ease of use.',
          },
          {
            type: 'textbox',
            id: 'suffix',
            name: 'Suffix',
            value: '',
            note: 'E.g. For ">" as the suffix Kappa> will work as intended. Suggestion; leave empty for ease of use.',
          },
        ],
      },
    ],
  }

  return !global.ZeresPluginLibrary
    ? class {
        constructor() {
          this._config = config
        }

        getName = () => config.info.name
        getAuthor = () => config.info.description
        getVersion = () => config.info.version

        load() {
          BdApi.showConfirmationModal(
            'Library Missing',
            `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
            {
              confirmText: 'Download Now',
              cancelText: 'Cancel',
              onConfirm: () => {
                require('request').get(
                  'https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js',
                  async (err, res, body) => {
                    if (err)
                      return require('electron').shell.openExternal(
                        'https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js',
                      )
                    await new Promise((r) =>
                      require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r),
                    )
                  },
                )
              },
            },
          )
        }

        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
          const {
            DiscordModules: { MessageActions },
            Patcher,
            PluginUtilities,
          } = Api
          return class Easymotes extends Plugin {
            constructor() {
              super()
            }

            doCleanup() {
              PluginUtilities.removeStyle(this.getName() + '-css')
            }

            getSettingsPanel() {
              const panel = this.buildSettingsPanel()
              panel.addListener(() => {
                this.doCleanup()
              })
              return panel.getElement()
            }

            waitForEmotes() {
              return new Promise((resolve, reject) => {
                const awaitEmotes = setInterval(() => {
                  this.libraries = ['TwitchGlobal', 'TwitchSubscriber', 'FrankerFaceZ', 'BTTV', 'BTTV2'].map(
                    (lib) => BdApi.emotes[lib],
                  )

                  if (this.libraries.every((lib) => Object.keys(lib).length)) {
                    clearInterval(awaitEmotes)
                    resolve()
                  }
                }, 1000)
              })
            }

            findEmote(name) {
              for (const emotes of this.libraries) {
                if (emotes[name] !== undefined) {
                  return emotes[name]
                }
              }
            }

            replaceText(message) {
              const emoteName = message.content.substring(
                this.settings.preferences.prefix.length,
                message.content.length - this.settings.preferences.suffix.length,
              )

              if (
                !message.content.startsWith(this.settings.preferences.prefix) ||
                !message.content.endsWith(this.settings.preferences.suffix)
              ) {
                return
              }
              const emote = this.findEmote(emoteName)
              if (emote) {
                message.content = emote
              }
            }

            async onStart() {
              await this.waitForEmotes()

              Patcher.before(MessageActions, 'sendMessage', (_, [, message]) => {
                this.replaceText(message)
              })

              Patcher.before(MessageActions, 'editMessage', (_, [, , message]) => {
                this.replaceText(message)
              })
            }

            onStop() {
              Patcher.unpatchAll()
              this.doCleanup()
            }
          }
        }

        return plugin(Plugin, Api)
      })(global.ZeresPluginLibrary.buildPlugin(config))
})()
