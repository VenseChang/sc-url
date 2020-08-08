(() => {
    const app = Stimulus.Application.start()
    let   settings = {}

    app.register("setting", class extends Stimulus.Controller {
        static get targets() {
            return [ 'shortcut', 'url', 'detail', 'filter' ]
        }

        add = () => {
            const sc  = this.shortcutTarget
            const url = this.urlTarget
            settings[sc.value.trim()] = url.value.trim()
            this.save()

            sc.value = ''
            url.value = ''
        }

        delete = (el) => {
            const sc = el.target.dataset.params
            if ( confirm(`Are you sure to remove this shortcut(${sc})?`) ) {
                delete settings[sc]
                this.save()
            }
        }

        filter = () => {
            let targets = {}
            const val = this.filterTarget.value.toLowerCase()

            if (val === '') { this.reloadPage(); return; }

            for (let sc in settings) {
                if (sc.toLowerCase().includes(val) || settings[sc].toLowerCase().includes(val)) {
                    targets[sc] = settings[sc]
                }
            }

            this.reloadPage(targets)
        }

        import = (e) => {
            let files = e.target.files
            if (files.length !== 1) return

            let file = files.item(0)
            var fr = new FileReader();
            fr.onload = event => {
                let res = event.target.result
                settings = JSON.parse(res)
                this.save()
            }
            fr.readAsText(file)
            e.target.value = ''
        }

        export = () => {
            if (Object.entries(settings).length === 0) {alert('The setting is empty!'); return;}

            let dataStr = JSON.stringify(settings)
            let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

            let linkElement = document.createElement('a')
            linkElement.setAttribute('href', dataUri)
            linkElement.setAttribute('download', 'sc.json')
            linkElement.click()
        }

        save = () => {
            this.reloadPage()
            chrome.storage.local.set({"settings": settings}, function() {})
            chrome.storage.sync.set({"settings": settings}, function() {})
        }

        reloadPage = (ss) => {
            let addBG = false
            this.detailTarget.innerHTML = ''

            Object.keys(ss || settings).sort().forEach( sc => {
                let content = ''
                if(Array.isArray(settings[sc])) {

                } else {
                    content += `<tr class='${addBG ? 'bg-gray-100' : ''}'>`
                    content += `<td class="border px-4 py-2">${sc}</td>`
                    content += `<td class="border px-4 py-2">${settings[sc]}</td>`
                    content += `<td class="border px-4 py-2 text-center"><button data-action="click->setting#delete" data-params="${sc}" class='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'>Delete</button></td>`
                    content += '</tr>'
                }
                this.detailTarget.innerHTML += content
                addBG = !addBG
            })
        }

        // Stimulus Lifecycle
        initialize() {
            chrome.storage.local.get("settings", res => {
                settings = res.settings
                this.reloadPage()
            })
            chrome.storage.sync.get("settings", function(result) {
                if (Object.entries(settings).length === 0) {
                    settings = result.settings
                    this.reloadPage()
                }
            })
        }
    })
  })()
