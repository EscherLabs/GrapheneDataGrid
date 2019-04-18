gform.stencils.actions = `
<table style="width:100%">
<thead>
<tr>
<th>
<div class="btn-group pull-left" style="white-space: nowrap; font-size: 0;" role="group" aria-label="...">

{{#options.actions}}
{{#name}}
<a href="javascript:void(0);" style="display: inline-block;font-size: 14px;float: none;clear: none;" data-event="{{name}}" class="grid-action disabled btn btn-{{type}}{{^type}}default{{/type}}">{{{label}}}</a>
{{/name}}

{{^name}}
</div>
</th>
<th style="width:100%">
<div class="btn-group pull-{{^align}}left{{/align}}{{align}}" style="margin-left:15px;white-space: nowrap; font-size: 0;" role="group" aria-label="...">

{{/name}}
{{/options.actions}}
</div>
</th>
</tr>
</thead>
</table>`

gform.stencils.count=`{{#checked_count}}<h5 class="range label label-info checked_count" style="margin:7px 0">{{checked_count}} item(s) selected</h5>{{/checked_count}}`;
gform.stencils.mobile_head=`
<div style="clear:both;">

  {{#options.sort}}

  <div class="row" style="margin-bottom:10px">

    <div class="col-xs-6">
    {{#options.filter}}

      <div name="reset-search" style="position:relative" class="btn btn-default" data-toggle="tooltip" data-placement="left" title="Clear Filters">
        <i class="fa fa-filter"></i>
        <i class="fa fa-times text-danger" style="position: absolute;right: 5px;"></i>
      </div>    

    <div class="btn btn-info filterForm">Filter</div>
  {{/options.filter}}
    </div>
    <div class="col-xs-6">
    		{{#options.search}}<input type="text" name="search" class="form-control" style="" placeholder="Search">{{/options.search}}
        </div>
    </div>
    <div class="input-group">
      <span class="" style="display: table-cell;width: 1%;white-space: nowrap;vertical-align: middle;padding-right:5px">
        <button class="btn btn-default reverse" type="button" tabindex="-1"><i class="fa fa-sort text-muted"></i></button>
      </span>
        <select class="form-control sortBy">
          <option value=true>None</option>
          {{#items}}
            {{#visible}}
              <option value="{{id}}">{{label}}</option>
            {{/visible}}
          {{/items}}
        <select>
    </div>
  {{/options.sort}}

</div>
`
gform.stencils.mobile_row=`<tr><td colspan="100%" class="filterable">		
{{^options.hideCheck}}
<div data-event="mark" style="text-align:left;padding:0;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;">
<span class="text-muted fa {{[[}}#checked{{]]}}fa-check-square-o{{[[}}/checked{{]]}} {{[[}}^checked{{]]}}fa-square-o{{[[}}/checked{{]]}}" style="margin:6px; cursor:pointer;font-size:24px"></span>
</div>
  {{/options.hideCheck}}
<div>
{{#items}}
{{#visible}}{{#isEnabled}}<div class="row" style="min-width:85px"><span class="col-sm-3"><b>{{label}}</b></span><span class="col-sm-9 col-xs-12">{{{name}}}</span></div>{{/isEnabled}}{{/visible}}
{{/items}}
</div>
</td></tr>`
gform.stencils.mobile_table=`<div class="well table-well">
<div style="height:40px;">
  <div name="actions" class=" pull-left" style="margin-bottom:10px;width:62%" ></div>

  <input type="file" class="csvFileInput" accept=".csv" style="display:none">

  <div class="hiddenForm" style="display:none"></div>
  <div class="btn-group pull-right" style="margin-bottom:10px" role="group" aria-label="...">
    {{#showAdd}}
    <div data-event="add" class="btn btn-success"><i class="fa fa-pencil-square-o"></i> New</div>
    {{/showAdd}}

    {{#options.actions}}
      {{#global}}<div class="btn btn-default custom-event" data-event="{{name}}" data-id="{{[[}}id{{]]}}">{{{label}}}</div>{{/global}}
    {{/options.actions}}
    {{#options.download}}
    <div class="btn btn-default hidden-xs" name="bt-download" data-toggle="tooltip" data-placement="left" title="Download"><i class="fa fa-download"></i></div>
    {{/options.download}}
    {{#options.upload}}
    <div class="btn btn-default hidden-xs" name="bt-upload" data-toggle="tooltip" data-placement="left" title="Upload"><i class="fa fa-upload"></i></div>
    {{/options.upload}}


    {{#options.columns}}
    <div class="btn-group columnEnables" data-toggle="tooltip" data-placement="left" title="Display Columns">
      <button class="btn btn-default dropdown-toggle" type="button" id="enables_{{options.id}}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
        <i class="fa fa-list"></i>
        <span class="caret"></span>
      </button>
      <ul class="dropdown-menu pull-right" style="padding-top:10px" aria-labelledby="enables_{{options.id}}">
        {{#items}}
        {{#visible}}
        <li><label data-field="{{id}}" style="width:100%;font-weight:normal"><input type="checkbox" {{#isEnabled}}checked="checked"{{/isEnabled}} style="margin: 5px 0 5px 15px;"> {{label}}</label></li>
        {{/visible}}
        {{/items}}
      </ul>
    </div>
    {{/options.columns}}

  </div>


</div>	
    {{>mobile_head}}


{{^options.hideCheck}}
<div style="padding: 16px 0 0 15px;"><i name="select_all" class="fa fa-2x fa-square-o"></i></div>
{{/options.hideCheck}}

<div class="table-container" style="width:100%;overflow:auto">

<div style="min-height:100px">
  <table class="table {{^options.noborder}}table-bordered{{/options.noborder}} table-striped table-hover dataTable" style="margin-bottom:0px">
    <tbody class="list-group">
      <tr><td>
        <div class="alert alert-info" role="alert">You have no items.</div>
      </td></tr>
    </tbody>

  </table>
</div>

</div>
<div class="paginate-footer" style="overflow:hidden;margin-top:10px"></div>
</div>`
gform.stencils.table=`<div class="well table-well">
<input type="file" class="csvFileInput" accept=".csv" style="display:none">
<div class="hiddenForm" style="display:none"></div>

<div style="overflow:hidden">
  <div name="actions" class=" pull-left" style="margin-bottom:10px;" ></div>
</div>	
<div>

  <div class="btn-group pull-right" style="margin-bottom:10px;margin-left:10px" role="group" aria-label="...">

    {{#options.download}}
    <div class="btn btn-default hidden-xs" name="bt-download" data-toggle="tooltip" data-placement="left" title="Download"><i class="fa fa-download"></i></div>
    {{/options.download}}
    {{#options.upload}}
    <div class="btn btn-default hidden-xs" name="bt-upload" data-toggle="tooltip" data-placement="left" title="Upload"><i class="fa fa-upload"></i></div>
    {{/options.upload}}


    {{#options.columns}}
    <div class="btn-group columnEnables" data-toggle="tooltip" data-placement="left" title="Display Columns">
      <button class="btn btn-default dropdown-toggle" type="button" id="enables_{{options.id}}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
        <i class="fa fa-list"></i>
        <span class="caret"></span>
      </button>
      <ul class="dropdown-menu pull-right" style="padding-top:10px;padding-left:10px" aria-labelledby="enables_{{options.id}}">
        {{#items}}
        {{#visible}}
        <li><label data-field="{{id}}" style="width:100%;font-weight:normal"><input type="checkbox" {{#isEnabled}}checked="checked"{{/isEnabled}}> {{label}}</label></li>
        {{/visible}}
        {{/items}}
      </ul>
    </div>
    {{/options.columns}}
  </div>
  {{#options.search}}<input type="text" name="search" class="form-control pull-right" style="max-width:300px; margin-bottom:10px" placeholder="Search">{{/options.search}}

  <span name="count"></span>
</div>

{{^options.autoSize}}
<div class="paginate-footer hidden-xs" style="overflow:hidden;margin-top:10px;clear:both"></div>
{{/options.autoSize}}

<div class="table-container" style="width:100%;overflow:auto">
{{#options.autoSize}}
<table class="table {{^options.noborder}}table-bordered{{/options.noborder}}" style="margin-bottom:0px">
<thead class="head">
{{>table_head}}
</thead>
</table>
{{/options.autoSize}}


<div style="min-height:100px">
  <table class="table {{^options.noborder}}table-bordered{{/options.noborder}} table-striped table-hover dataTable" style="margin-bottom:0px;{{#options.autoSize}}margin-top: -19px;{{/options.autoSize}}">
    {{^options.autoSize}}
    <thead class="head">
    {{>table_head}}
    </thead>
    {{/options.autoSize}}
{{#options.autoSize}}
    <thead>
          <tr  class="list-group-row">
              {{^options.hideCheck}}
  <th style="width:60px" class="select-column"></th>
  {{/options.hideCheck}}
        {{#items}}
  {{#visible}}
<th  style="min-width:85px">
  {{/visible}}
  {{/items}}
  </tr>
  </thead>
{{/options.autoSize}}
    <tbody class="list-group">
      <tr><td>
        <div class="alert alert-info" role="alert">You have no items.</div>
      </td></tr>
    </tbody>

  </table>
</div>

</div>
<div class="paginate-footer" style="overflow:hidden;margin-top:10px"></div>
</div>`
gform.stencils.table_footer=`<div>
{{#multiPage}}
<nav class="pull-right" style="margin-left: 10px;">
{{#size}}
  <ul class="pagination" style="margin:0">
    {{^isFirst}}
    {{^showFirst}}<li class="pagination-first"><a data-page="1" href="javascript:void(0);" aria-label="First"><span aria-hidden="true">&laquo;</span></a></li>{{/showFirst}}
    <li><a data-page="dec" href="javascript:void(0);" aria-label="Previous"><span aria-hidden="true">&lsaquo;</span></a></li>
    {{/isFirst}}
    {{#pages}}
      <li class="{{active}}"><a data-page="{{name}}" href="javascript:void(0);">{{name}}</a></li>
    {{/pages}}
    {{^isLast}}
    <li><a data-page="inc" href="javascript:void(0);" aria-label="Next"><span aria-hidden="true">&rsaquo;</span></a></li>
    {{^showLast}}<li class="pagination-last"><a data-page="" href="javascript:void(0);" aria-label="Last"><span aria-hidden="true">&raquo;</span></a></li>{{/showLast}}
    {{/isLast}}

  </ul>
{{/size}}
</nav>

{{/multiPage}}	
<h5 class="range badge {{^size}}alert-danger{{/size}} pull-left" style="margin-right:15px;">{{#size}}Showing {{first}} to {{last}} of {{size}} results{{/size}}{{^size}}No matching results{{/size}}</h5>
  {{#entries.length}}
  <span class="pull-left">
    <select class="form-control" style="display:inline-block;width:auto;min-width:50px" name="count">
    <option value="10000">All</option>
    {{#entries}}
    <option value="{{value}}" {{#selected}}selected="selected"{{/selected}}>{{value}}</option>
    {{/entries}}

    </select>
    <span class="hidden-xs">results per page</span>
  </span>
  {{/entries.length}}
</div>`
gform.stencils.table_head=`  <tr style="cursor:pointer" class="noselect table-sort">
{{^options.hideCheck}}
<th style="width: 60px;min-width:60px;padding: 0 0 0 20px;" class="select-column"><i name="select_all" class="fa fa-2x fa-square-o"></i></th>
{{/options.hideCheck}}

{{#items}}
{{#visible}}
<th {{#options.sort}}data-sort="{{cname}}"{{/options.sort}}><h6 style="margin: 2px;font-size:13px;white-space: nowrap">{{#options.sort}}<i class="fa fa-sort text-muted"></i> {{/options.sort}}{{label}}</h6></th>
{{/visible}}
{{/items}}
</tr>
{{#options.filter}}
<tr class="filter">
{{^options.hideCheck}}<td>
<div name="reset-search" style="position:relative" class="btn" data-toggle="tooltip" data-placement="left" title="Clear Filters">
  <i class="fa fa-filter"></i>
  <i class="fa fa-times text-danger" style="position: absolute;right: 5px;"></i>
</div>
</td>{{/options.hideCheck}}

{{#items}}
{{#visible}}
<td data-inline="{{cname}}" style="min-width:85px" id="{{id}}"></td>
{{/visible}}
{{/items}}
</tr>
{{/options.filter}}`
gform.stencils.table_row=`{{^options.hideCheck}}

<td data-event="mark" data-id="{{[[}}id{{]]}}" style="width: 60px;min-width:60px;text-align:left;padding:0;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;">
  <span class="text-muted fa {{[[}}#iswaiting{{]]}}fa-spinner fa-spin {{[[}}/iswaiting{{]]}} {{[[}}^iswaiting{{]]}} {{[[}}#checked{{]]}}fa-check-square-o{{[[}}/checked{{]]}} {{[[}}^checked{{]]}}fa-square-o{{[[}}/checked{{]]}}{{[[}}/iswaiting{{]]}} " style="margin:6px 0 6px 20px; cursor:pointer;font-size:24px"></span>
   </td>

  {{/options.hideCheck}}
{{#items}}
{{#visible}}{{#isEnabled}}<td style="min-width:85px">{{{name}}}</td>{{/isEnabled}}{{/visible}}
{{/items}}`
