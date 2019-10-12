lib.getEle = (selector) =>{
    return document.querySelector(selector);
}

lib.getAllEle = (selector) => {
    return document.querySelectorAll(selector);
}

lib.removeEle = (obj) => {
    while (obj.firstChild) {
        obj.removeChild(obj.firstChild);
    }
}

lib.createEle = (tagName, settings, parentElement) => {
	let obj=document.createElement(tagName);
	if(settings.atrs){lib.setAttributes(obj,settings.atrs);}
	if(settings.stys){lib.setStyles(obj,settings.stys);}
	if(settings.evts){lib.setEventHandlers(obj,settings.evts);}
	if(parentElement instanceof Element){parentElement.appendChild(obj);}
	return obj;
};

lib.setStyles = (obj,styles) => {
	for(let name in styles){
		obj.style[name] = styles[name];
	}
	return obj;
};

lib.setAttributes = (obj, attributes) => {
	for(let name in attributes){
		obj[name] = attributes[name];
	}
	return obj;
};

useCapture = false;
lib.setEventHandlers = (obj, eventHandlers, useCapture) => {
	for(let name in eventHandlers){
		if(eventHandlers[name] instanceof Array){
			for(let i = 0;i < eventHandlers[name].length ; i++){
				obj.addEventListener(name,eventHandlers[name][i],useCapture);
			}
		}else{
			obj.addEventListener(name,eventHandlers[name],useCapture);
		}
	}
	return obj;
};