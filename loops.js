// // print numbers from 1 to 10?
// for (let i = 1; i<= 10; i++){
//     console.log(i)
// };

// print numbers from 10 to 1

// for (let i=10; i>=1; i--){
//     console.log(i)
// };


// print numbers from 1 to N?

// n=10;
// for ( let i=1; i<=n;i++){
//     console.log(i)
// };

// priint even numbers from 1 to 20?

// for (let i=1; i<=20; i++){
//     if(i%2=== 0){
//         console.log(i)
//     }
// };

// print odd numbers from 1 to 20?

// for (let i=1; i <=20; i++){
//     if (i%2 !==0){
//         console.log(i)
//     }
// };

// print multiples of 5 from 1 to 50?

// for (let i = 5; i <= 50; i++ ){
//     console.log(i)
// };


// for (let i=1; i<=50; i++){
//     if(i%5===0){
//         console.log(i)
//     }
// };

// print the multiplication table of a given number?


// n = 5;
// for (let i =1; i<=12; i++){
//     console.log(n + "X" + i + "=" + n * i)
// };

// n = 10;
// for ( let i = 1; i <= 50; i++){
//     console.log(n + "X" + i + "=" + n * i)
// };

// print 1 to 100 and count how many numbers are printed?


//  let count = 0;
//  for ( let i=1; i <= 100; i++){
//     console.log(i);
//     count++
//  } console.log("total", count );


// find sum number from 1 to N?


// let n = 8;
// let sum = 0;
// for( let i = 1; i <=n; i++)
// {
//     sum = sum + i
// }
// console.log(sum);

// sum of even numbers from `1 to N?


// let n = 10;
// let sum = 0;
// for (let i = 1; i <= n; i++)
// { 
//     if (i % 2===0){
//         sum = sum + i
//     }
// }console.log(sum);

// count the digit in a number?

// let n = 5832;
// let count = 0;
// while(n > 0){
//     n = Math.floor(n/10)
//     count++
// }console.log(count);

// find the sum of numbers?

// let n = 1234;
// let sum = 0;

// while (n > 0){
//     let digit = n %10;
//     sum = sum + digit;
//     n = Math.floor( n/10)
// }console.log(sum);

let n = 1234;
let reverse = 0;
while ( n > 0){
    let digit = n % 10;
    reverse = reverse * 10 + digit;
    n = Math.floor(n/10)
}console.log(reverse);