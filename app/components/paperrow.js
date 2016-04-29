var css = require('dom-css')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var selection = require('d3-selection')
var path = require('path')

var yo = require('yo-yo')
var csjs = require('csjs')

var reader = require('../lib/reader.js')
var iconbutton = require('./iconbutton.js')
var asseticon = require('./asseticon.js')
var buttonbar = require('./buttonbar.js')
var loading = require('./loading.js')
var articletype = require('./articletype.js')
var textMinedTerms = require('./textminedterms.js')

inherits(PaperRow, EventEmitter)

function PaperRow (paper) {
  if (!(this instanceof PaperRow)) return new PaperRow(paper)
  var self = this
  this.paper = paper

  var lensReader = null

  var xml = asseticon({ ext: 'xml', hidden: true })
  xml.on('click', function () {
    self.emit('xml-click')
    console.log('xml-click')
    lensReader = reader(self.paper, self.opts)
    lensReader.show()
  })

  self.assets = {
    xml: xml
  }

  self.getAssets = function() {
    return _.map(self.assets, (value, key) => value.element)
  }

  self.loading = loading({
    position: 'absolute',
    bottom: 0,
    right: 4,
    display: 'none'
  })

  self.type = articletype(self.paper.type)

  self.terms = textMinedTerms(self.paper)

  self.render = function () {
    var row = yo`
    <div class="row paper-table-row clickable paper">
      <div class="td col-type">${self.type.element}</div>
      <div class="td col-title">${self.paper.title}</div>
      <div class="td col-author">${self.paper.etalia()}</div>
      <div class="td col-year">${self.paper.year}</div>
      <div class="td col-ids">
        ${self.paper.identifier
          .filter((id) => id.type !== 'publisher-id')
          .map((id) => {
            return yo`
            <div class="paper-table-row-id">
              <span class="paper-id-type">${id.type}</span>
              ${id.id}</div>`
          })
        }
      </div>
      <div class="td col-terms">
        ${self.terms.render()}
      </div>
      <div class="td col-actions">
        ${self.getAssets()}
      </div>
      ${self.loading.element}
    </div>
    `

    row.onclick = function () {
      self.emit('click')
    }
    if (self.row) {
      yo.update(self.row, row)
    } else {
      self.row = row
    }
  }

  self.render()

  self.row.addEventListener("mouseenter", function (event) {
  })

  self.row.addEventListener("mouseleave", function (event) {
  })

  function getAsset (apath) {
    var ext = path.extname(apath).substring(1)
    if (ext === 'supp') {
      return null
    }
    var asset = self.assets[ext]
    if (!asset) {
      asset = self.assets[ext] = asseticon({ ext: ext })
    }
    return asset
  }

  function updateTextMinedTerms () {
    self.terms.load()
  }

  function updateAssets () {
    self.paper.assetPaths().forEach(function(apath) {
      var asset = getAsset(apath)
      asset.found()
    })
    updateTextMinedTerms()
    self.render()
  }

  var stopLoading = function() {
    if (paper.downloadsRunning == 0) setTimeout(self.loading.hide, 500)
  }

  self.paper.on('download.start', function () {
    console.log('download started')
    self.loading.show()
  })

  self.paper.on('download.finished', function() {
    updateAssets()
    updateTextMinedTerms()
    stopLoading()
  })

  self.paper.on('download.error', function () {
    updateAssets()
    updateTextMinedTerms()
    stopLoading()
  })

  // self.updateBar(0, 9999)
  // self.loadFile()

  updateAssets()
  updateTextMinedTerms()

}

module.exports = PaperRow
