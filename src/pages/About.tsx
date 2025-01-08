import React from 'react'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className='container mx-auto px-4 py-8'>
        <div className=' flex flex-col items-center justify-center border border-gray-200 max-w-4xl mx-auto my-8 p-8 rounded-lg bg-white/20'>
        <h1 className='text-4xl font-bold text-white'>About</h1>
        <p className='text-white mt-4 font-medium'>This is a completely fan-made online version of Snake Oil, a brilliant board game. It is not affiliated with the official Snake Oil Game in any way. Please click <Link to='https://snakeoilgame.com' className='text-purple-500 hover:text-purple-600'>here</Link> to see the real thing.</p>
        <p className='text-white mt-4 font-medium'>I made this game for fun and learning purposes as an aspiring developer. You'll find that unlike the real Snake Oil, the game only involves two players. I hope to be able to support more players in the future.</p>
        </div>
    </div>
  )
}
