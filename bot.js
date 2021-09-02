const fs        = require('fs')
const dotenv    = require('dotenv').config()
const Telegraf  = require('telegraf')
const bot       = new Telegraf(process.env.BOT_TOKEN) 
const nearApi   = require('near-api-js')
const seedPh    = require('near-seed-phrase')
const words     = fs.readFileSync('./words.txt').toString().replace(/\r/g,'').split('\n')

keysList = async (accountId) => {
	try{
		const network = accountId.substr(-5) == '.near'?'mainnet':'testnet'
		const config  = {networkId:network, nodeUrl:'https://rpc.'+network+'.near.org'}
		const keyStore = new nearApi.keyStores.InMemoryKeyStore()
		const near = await nearApi.connect({deps:{keyStore},...config})
		const account = await near.account(accountId)
		return await account.getAccessKeys()
	}catch(err){
		return {error:err.type || err}
	}
}
oneLetter = (word) => {
	const list = []
	for (const w of words){
		if (w.length!=word.length){
			if (Math.abs(w.length-word.length)>1) continue
			if (w.length-word.length < 0){
				for (let i=0;i<word.length;i++){
					const wrd = word.substr(0,i)+word.substr(i+1)
					if (w === wrd && list.indexOf(wrd)<0) list.push(wrd)
				}	
			}
		} else {
			let count = 0
			for (let i=0;i<word.length;i++) if (word[i]!=w[i]) count++
			if (count<2) list.push(w)
		}
	}
	const res = (' '+words.join(' ')+' ').match(new RegExp(' (\\w?'+[...word].join('\\w?')+'\\w?) ','g'))
	if (res){
		for (const w of res){ 
			const wrd = w.trim()
			if (Math.abs(wrd.length-word.length)<2 && list.indexOf(wrd)<0) list.push(wrd)
		}	
	}
	if (!list.length) list.push(word)
	return list
}
oneList = async (mywords,klist) => {
	let count = 0, d = Date.now()
	const nearWords = [], result = []
	for (const word of mywords) nearWords.push(oneLetter(word))
	for (let i0=0;  i0<nearWords[0].length;  i0++)
	for (let i1=0;  i1<nearWords[1].length;  i1++)
	for (let i2=0;  i2<nearWords[2].length;  i2++)
	for (let i3=0;  i3<nearWords[3].length;  i3++)
	for (let i4=0;  i4<nearWords[4].length;  i4++)
	for (let i5=0;  i5<nearWords[5].length;  i5++)
	for (let i6=0;  i6<nearWords[6].length;  i6++)
	for (let i7=0;  i7<nearWords[7].length;  i7++)
	for (let i8=0;  i8<nearWords[8].length;  i8++)
	for (let i9=0;  i9<nearWords[9].length;  i9++)
	for (let i10=0; i10<nearWords[10].length;i10++)
	for (let i11=0; i11<nearWords[11].length;i11++){
		count++ 		
		const phrase = [nearWords[0][i0],nearWords[1][i1],nearWords[2][i2],nearWords[3][i3],nearWords[4][i4],nearWords[5][i5],nearWords[6][i6],nearWords[7][i7],nearWords[8][i8],nearWords[9][i9],nearWords[10][i10],nearWords[11][i11]]
		const creds = seedPh.parseSeedPhrase(phrase.join(' '))
		if (klist.find(e => e.public_key == creds.publicKey)){
			let text = '', count = 0
			for (let i=0; i<12; i++){
				if (mywords[i]!==phrase[i]) count++
				text += (mywords[i]===phrase[i]?mywords[i]:'<b>'+phrase[i]+'</b>')+' '
			}
			return 'Seed phrase corrected'+(count?' ('+count+')':'')+'\n\n'+text
		}	
	}
}

bot.start(ctx => ctx.reply('Enter your wallet and seed phrase'))
bot.on('text', async ctx => {
	const phrase = ctx.message.text.toLowerCase()
	const wallet = /([a-z0-9-_\.]{1,59}\.(near|testnet))/.exec(phrase)
	if (!wallet) return ctx.reply('No wallet address found')
	const mywords = phrase.replace(/([a-z0-9-_\.]{1,59}\.(near|testnet))/,'').replace(/[\n\r]/g,' ').trim().replace(/  /g,' ').split(' ') 
	if (mywords.length!=12) return ctx.reply('Seed phrase must contain 12 words')
	const creds = seedPh.parseSeedPhrase(mywords.join(' '))
	const klist = await keysList(wallet[1])
	if (klist.find(e => e.public_key == creds.publicKey)) return ctx.reply('Seed phrase is OK')
	const mess = await ctx.reply('Brutforce "one letter misprint" in process ...')
	const res  = await oneList(mywords,klist) 
	if (res) return ctx.telegram.editMessageText(ctx.from.id,mess.message_id,null,res,{parse_mode:'HTML'})
	let text = ''
	for (const word of mywords) if (words.indexOf(word)<0) text += 'the word "'+word+'" is not in the dictionary\n'
	if (text.length) return ctx.telegram.editMessageText(ctx.from.id,mess.message_id,null,text,{parse_mode:'HTML'})
	return ctx.telegram.editMessageText(ctx.from.id,mess.message_id,null,res?res:'Original seed phrase not found',{parse_mode:'HTML'})
})
bot.catch(err => console.error(err))
bot.launch({polling:{timeout:60}})
