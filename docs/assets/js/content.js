//cb = new Cobler({ disabled: false, targets: [document.getElementById('editor'),document.getElementById('editor2')],items:[[]]})

cb = new Cobler({ disabled: false, targets: document.getElementsByClassName('widget_container'), items:[[]]})

list = document.getElementById('sortableList');
cb.addSource(list);
list.addEventListener('click', function(e) {
  cb.collections[0].addItem($(e.target).closest('li').data('type'));
})

// cbMain = new Cobler({ disabled: false,group:'fieldsets', targets: [$('.row')[0]],items:[[]]})

// document.getElementById('addFieldset').addEventListener('click', function(e) {
//   cbMain.collections[0].addItem('fieldset');
//   cbMain.on('change',function(s){
//     // debugger;
//     var temp = $('<div>').addClass('widget_container')
//     $('[name='+s.get().name+']').append(temp);
//     cb.addCollection(temp[0], [])
//   })
//   // cb.addCollection()
// })
mysortable = Sortable.create($('.row')[0])
function getOrdered() {
  var items = cb.toJSON(true);
  return _.map(mysortable.toArray(), function(item){
    return _.findWhere(items, {target: item})['items']
  })
}