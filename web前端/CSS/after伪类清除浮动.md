```javascript
HTML：

<div class="box clear">
    <img src="/images/common/l/1.jpg">
</div>

.box {
    padding: 10px;
    background-color: #cd0000;
}
.box > img {
   float: left;
}

.clear:after {
    content: "";
    display: 'block';// 或者table,list-item
    clear: both;
}


```
