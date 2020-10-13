// site configuration options.
const { resolve } = require('path')
const {
  linkDocblocks,
  transpileCodeblocks
} = require('remark-typescript-tools')

module.exports = {
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: '../docs',
          sidebarPath: require.resolve('./sidebars.json'),
          routeBasePath: '/',
          include: ['{api,assets,introduction,tutorials,usage}/*.{md,mdx}'], // no other way to exclude node_modules
          remarkPlugins: [
            [
              linkDocblocks,
              {
                extractorSettings: {
                  tsconfig: resolve(__dirname, '../docs/tsconfig.json'),
                  basedir: resolve(__dirname, '../src'),
                  rootFiles: ['index.ts']
                }
              }
            ],
            [
              transpileCodeblocks,
              {
                compilerSettings: {
                  tsconfig: resolve(__dirname, '../docs/tsconfig.json'),
                  externalResolutions: {
                    '@reduxjs/toolkit': {
                      resolvedPath: resolve(__dirname, '../src'),
                      packageId: {
                        name: '@reduxjs/toolkit',
                        subModuleName: 'index.ts',
                        version: '1.0'
                      }
                    }
                  }
                }
              }
            ]
          ]
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      }
    ]
  ],
  projectName: 'redux-toolkit',
  baseUrl: '/',
  favicon: 'img/favicon/favicon.ico',
  tagline:
    '一个官方提供用于Redux高效开发，有想法的、功能齐全的工具包',
  title: 'Redux工具包 中文文档',
  url: 'https://redux-toolkit.js.org',
  customFields: {
    repoUrl: 'https://github.com/DeerTeam/redux-toolkit-in-chinese'
  },
  themeConfig: {
    metadatas: [{ name: 'twitter:card', content: 'summary' }],
    prism: {
      theme: require('./src/js/monokaiTheme.js')
    },
    image: 'img/redux-logo-landscape.png',
    navbar: {
      title: 'Redux工具包 中文文档',
      logo: {
        alt: 'Redux Logo',
        src: 'img/redux.svg'
      },
      items: [
        {
          to: 'introduction/quick-start',
          label: '快速开始',
          position: 'right'
        },
        { to: 'api/configureStore', label: 'API', position: 'right' },
        {
          href: 'https://github.com/DeerTeam/redux-toolkit-in-chinese',
          label: 'GitHub(中文仓库)',
          position: 'right'
        },
        {
          href: 'https://github.com/reduxjs/redux-toolkit',
          label: 'GitHub(English version)',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      logo: {
        alt: 'Redux Logo',
        src: 'img/redux_white.svg'
      },
      links: [
        {
          title: '文档',
          items: [
            {
              label: '快速开始',
              to: 'introduction/quick-start'
            },
            {
              label: 'API 参考',
              to: 'api/configureStore'
            }
          ]
        },
        {
          title: '社区',
          items: [
            {
              label: 'Stack Overflow',
              href: 'http://stackoverflow.com/questions/tagged/redux'
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/0ZcbPKXt5bZ6au5t'
            },
            {
              label: 'Redux工具包 中文文档',
              href: 'https://github.com/DeerTeam/redux-toolkit-in-chinese'
            }
          ]
        },
        {
          title: '更多',
          items: [
            {
              label: 'GitHub',
              href: 'https://www.github.com/reduxjs/redux-toolkit'
            },
            {
              label: 'GitHub(中文文档)',
              href: 'https://github.com/DeerTeam/redux-toolkit-in-chinese'
            },
            {
              html: `
                <a href="https://www.netlify.com">
                  <img
                    src="https://www.netlify.com/img/global/badges/netlify-light.svg"
                    alt="由Netlify部署"
                  />
                </a>
              `
            }
          ]
        }
      ],
      copyright: `Copyright © 2015–${new Date().getFullYear()} Dan Abramov and the Redux documentation authors. 中文由[DeerTeam](https://github.com/DeerTeam)前端团队翻译制作。`
    },
    image: 'img/redux-logo-landscape.png',
    navbar: {
      title: 'Redux工具包',
      logo: {
        alt: 'Redux Logo',
        src: 'img/redux.svg'
      },
      items: [
        {
          to: 'introduction/quick-start',
          label: '快速开始',
          position: 'right'
        },
        { to: 'api/configureStore', label: 'API', position: 'right' },
        {
          href: 'https://github.com/DeerTeam/redux-toolkit-in-chinese',
          label: 'GitHub(中文仓库)',
          position: 'right'
        },
        {
          href: 'https://github.com/reduxjs/redux-toolkit',
          label: 'GitHub(English version)',
          position: 'right'
        }
      ]
    },
    algolia: {
      apiKey: '82d838443b672336bf63cab4772d9eb4',
      indexName: 'redux-starter-kit',
      algoliaOptions: {}
    },
    googleAnalytics: {
      trackingID: 'UA-130598673-3'
    }
  }
}
