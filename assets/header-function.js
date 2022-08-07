var hambuger_button=document.getElementById("js-hambuger");
hambuger_button.addEventListener('click',function () {
var menu=document.getElementById("mobilenav");
console.log("menu");
if(menu.style.transform == "translate(-100%)" )
{
  menu.style.transform= "translate(0%)";
}
else
{
  menu.style.transform= "translate(-100%)";
}
})

 // on scroll having a box shadow



 window.addEventListener('scroll',  (e)=> {

var nav = document.getElementsByClassName('sticky-header')[0];
if (window.pageYOffset>0) {

  nav.classList.add('add-shadow');
  
}
else{
  nav.classList.remove('add-shadow');
}
});